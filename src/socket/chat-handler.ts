import { Server, Socket } from "socket.io";
import { chatService } from "../domain/chat-service";
import { jwtService } from "../application/jwt-service";
import { userService } from "../domain/users-service";
import { directChatService } from "../domain/direct-chat-service";
import { directChatRepository } from "../repositories/mongo/direct-chat-mongo-repository";
import { ObjectId } from "mongodb";
import { logger } from "../logger";

const userSockets = new Map<string, string>();

const normalizeId = (id: string): string => {
  const stripped = String(id).replace(/^0+/, "");
  return stripped || String(id);
};

export const setupChatHandlers = (io: Server) => {
  io.on("connection", async (socket: Socket) => {
    logger.info({ socketId: socket.id }, "Пользователь подключился");

    const AUTH_TIMEOUT = process.env.NODE_ENV === "production" ? 30000 : 5000;

    const authTimeout = setTimeout(() => {
      if (!socket.data.authorized) {
        logger.warn({ socketId: socket.id }, "Таймаут авторизации — отключаем");
        socket.disconnect(true);
      }
    }, AUTH_TIMEOUT);

    const token = socket.handshake.auth.token;

    if (!token) {
      clearTimeout(authTimeout);
      socket.emit("error", { message: "Unauthorized: No token provided" });
      socket.disconnect(true);
      return;
    }

    const userId = await jwtService.getUserIdByToken(token);

    if (!userId) {
      clearTimeout(authTimeout);
      socket.emit("error", { message: "Unauthorized: Invalid token" });
      socket.disconnect(true);
      return;
    }

    const user = await userService.findUserById(userId);

    if (!user) {
      clearTimeout(authTimeout);
      socket.emit("error", { message: "User not found" });
      socket.disconnect(true);
      return;
    }

    const userObjectId =
      user._id instanceof ObjectId
        ? user._id
        : new ObjectId(String(user._id).padStart(24, "0"));

    socket.data.authorized = true;
    clearTimeout(authTimeout);

    logger.info(
      { userName: user.userName, socketId: socket.id },
      "Авторизован",
    );

    const userIdKey = normalizeId(String(userId));
    userSockets.set(userIdKey, socket.id);

    try {
      const message = await chatService.getAllMessagesSince(user.createdAt);
      socket.emit("message_history", message);
    } catch (error) {
      logger.error({ error }, "❌ MongoDB unavailable, skipping history");
      socket.emit("message_history", []);
    }

    socket.on(
      "send_message",
      async (data: {
        message: string;
        fileUrl?: string;
        fileType?: "image" | "video" | "audio" | "raw";
        fileName?: string;
        avatarUrl?: string;
      }) => {
        try {
          const newMessage = await chatService.sendMessage(
            userObjectId,
            user.userName,
            data.avatarUrl || user.avatarUrl,
            data.message,
            data.fileUrl,
            data.fileType,
            data.fileName,
          );
          io.emit("new_message", newMessage);
        } catch (error) {
          logger.error({ error }, "Ошибка отправки сообщения");
          socket.emit("error", { message: "Failed to send message" });
        }
      },
    );

    socket.on("join_direct", async (data: { toUserId: string }) => {
      try {
        const toUserId = new ObjectId(data.toUserId);
        const chatId = directChatRepository.getChatId(userObjectId, toUserId);
        socket.join(`direct_${chatId}`);
        const messages = await directChatService.getMessages(
          userObjectId,
          toUserId,
        );
        socket.emit("direct_history", { chatId, messages });
      } catch (error) {
        logger.error({ error }, "Ошибка join_direct");
      }
    });

    socket.on(
      "send_direct",
      async (data: {
        toUserId: string;
        toUserName: string;
        message: string;
        fileUrl?: string;
        fileType?: "image" | "video" | "audio" | "raw";
        fileName?: string;
        avatarUrl?: string;
      }) => {
        try {
          const toUserId = new ObjectId(data.toUserId);
          const chatId = directChatRepository.getChatId(userObjectId, toUserId);
          const newMessage = await directChatService.sendMessage(
            userObjectId,
            user.userName,
            data.avatarUrl || user.avatarUrl,
            toUserId,
            data.toUserName,
            data.message,
            data.fileUrl,
            data.fileType,
            data.fileName,
          );
          io.to(`direct_${chatId}`).emit("new_direct_message", newMessage);
          const toUserIdKey = normalizeId(data.toUserId);
          const recipientSocketId = userSockets.get(toUserIdKey);
          if (recipientSocketId && recipientSocketId !== socket.id) {
            const recipientSocket = io.sockets.sockets.get(recipientSocketId);
            const roomKey = `direct_${chatId}`;
            if (recipientSocket && !recipientSocket.rooms.has(roomKey)) {
              recipientSocket.emit("new_direct_message", newMessage);
            }
          }
        } catch (error) {
          logger.error({ error }, "Ошибка send_direct");
          socket.emit("error", { message: "Failed to send direct message" });
        }
      },
    );

    socket.on("get_direct_chats", async () => {
      try {
        const chats = await directChatService.getUserChats(userObjectId);
        socket.emit("direct_chats", chats);
      } catch (error) {
        logger.error({ error }, "Ошибка get_direct_chats");
        socket.emit("error", { message: "Failed to get direct chats" });
      }
    });

    socket.on("clear_direct", async (data: { toUserId: string }) => {
      try {
        const toUserId = new ObjectId(data.toUserId);
        await directChatService.clearMessages(userObjectId, toUserId);
        const chatId = directChatRepository.getChatId(userObjectId, toUserId);
        io.to(`direct_${chatId}`).emit("direct_cleared", { chatId });
      } catch (error) {
        logger.error({ error }, "Ошибка clear_chat");
      }
    });

    socket.on("typing_direct", (data: { toUserId: string }) => {
      const toUserId = new ObjectId(data.toUserId);
      const chatId = directChatRepository.getChatId(userObjectId, toUserId);
      io.to(`direct_${chatId}`).emit("user_typing", {
        userId: userObjectId.toString(),
        userName: user.userName,
      });
    });

    socket.on("stop_typing_direct", (data: { toUserId: string }) => {
      const toUserId = new ObjectId(data.toUserId);
      const chatId = directChatRepository.getChatId(userObjectId, toUserId);
      io.to(`direct_${chatId}`).emit("user_stop_typing", {
        userId: userObjectId.toString(),
      });
    });

    socket.on("mark_read", async (data: { toUserId: string }) => {
      try {
        const toUserId = new ObjectId(data.toUserId);
        await directChatService.markAsRead(userObjectId, toUserId);
        const chatId = directChatRepository.getChatId(userObjectId, toUserId);
        io.to(`direct_${chatId}`).emit("messages_read", {
          userId: userObjectId.toString(),
        });
      } catch (error) {
        logger.error({ error }, "Ошибка mark_read");
      }
    });

    socket.on(
      "call_offer",
      (data: {
        toUserId: string;
        offer: RTCSessionDescriptionInit;
        isVideo?: boolean;
      }) => {
        const toUserIdKey = normalizeId(data.toUserId);

        if (toUserIdKey === userIdKey) return;
        const recipientSocketId = userSockets.get(toUserIdKey);
        if (recipientSocketId) {
          io.to(recipientSocketId).emit("call_incoming", {
            fromUserId: userIdKey,
            fromUserName: user.userName,
            fromAvatarUrl: user.avatarUrl,
            offer: data.offer,
            isVideo: data.isVideo || false,
          });
        }
      },
    );

    socket.on(
      "call_answer",
      (data: { toUserId: string; answer: RTCSessionDescriptionInit }) => {
        const toUserIdKey = normalizeId(data.toUserId);
        const recipientSocketId = userSockets.get(toUserIdKey);
        if (recipientSocketId) {
          io.to(recipientSocketId).emit("call_answered", {
            fromUserId: userIdKey,
            answer: data.answer,
          });
        }
      },
    );

    socket.on(
      "ice_candidate",
      (data: { toUserId: string; candidate: RTCIceCandidateInit }) => {
        const toUserIdKey = normalizeId(data.toUserId);
        const recipientSocketId = userSockets.get(toUserIdKey);
        if (recipientSocketId) {
          io.to(recipientSocketId).emit("ice_candidate", {
            fromUserId: userIdKey,
            candidate: data.candidate,
          });
        }
      },
    );

    socket.on("call_reject", (data: { toUserId: string }) => {
      const toUserIdKey = normalizeId(data.toUserId);
      const recipientSocketId = userSockets.get(toUserIdKey);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("call_rejected", {
          fromUserId: userIdKey,
        });
      }
    });

    socket.on("call_end", (data: { toUserId: string }) => {
      const toUserIdKey = normalizeId(data.toUserId);
      const recipientSocketId = userSockets.get(toUserIdKey);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("call_ended", { fromUserId: userIdKey });
      }
    });

    socket.on("disconnect", () => {
      userSockets.delete(userIdKey);
      logger.info(
        { userName: user.userName, socketId: socket.id },
        "Клиент отключился",
      );
    });
  });
};
