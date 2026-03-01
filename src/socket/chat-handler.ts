import { Server, Socket } from "socket.io";
import { chatService } from "../domain/chat-service";
import { jwtService } from "../application/jwt-service";
import { userService } from "../domain/users-service";
import { directChatService } from "../domain/direct-chat-service";
import { directChatRepository } from "../repositories/mongo/direct-chat-mongo-repository";
import { ObjectId } from "mongodb";

export const setupChatHandlers = (io: Server) => {
  io.on("connection", async (socket: Socket) => {
    console.log("Пользователь подключился:", socket.id);

    const token = socket.handshake.auth.token;

    if (!token) {
      socket.emit("error", { message: "Unauthorized: No token provided" });
      socket.disconnect();
      return;
    }

    const userId = await jwtService.getUserIdByToken(token);

    if (!userId) {
      socket.emit("error", { message: "Unauthorized: Invalid token" });
      socket.disconnect();
      return;
    }

    const user = await userService.findUserById(userId);

    if (!user) {
      socket.emit("error", { message: "User not found" });
      socket.disconnect();
      return;
    }

    if (!(user._id instanceof ObjectId)) {
      socket.emit("error", { message: "Invalid user ID type" });
      socket.disconnect();
      return;
    }

    const userObjectId = user._id;

    console.log(`Авторизован: ${user.userName} (${socket.id})`);

    const message = await chatService.getAllMessagesSince(user.createdAt);
    socket.emit("message_history", message);

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
          console.error("Ошибка отправки сообщения:", error);
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
        console.error("Ошибка join_direct", error);
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
        } catch (error) {
          console.error("Ошибка send_direct", error);
          socket.emit("error", { message: "Failed to send direct message" });
        }
      },
    );

    socket.on("get_direct_chats", async () => {
      try {
        const chats = await directChatService.getUserChats(userObjectId);
        socket.emit("direct_chats", chats);
      } catch (error) {
        console.error("Ошибка get_direct_chats:", error);
        socket.emit("error", { message: "Failed to get direct chats" });
      }
    });

    socket.on("clear_direct", async (data: { toUserId: string }) => {
      try {
        const toUserId = new ObjectId(data.toUserId);
        await directChatService.clearMessages(userObjectId, toUserId);
        const chatId = directChatRepository.getChatId(userObjectId, toUserId);
        io.to(`direct_${chatId}`).emit("direct_clered", { chatId });
      } catch (error) {
        console.error("Ошибка clear_chat", error);
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
        console.error("Ошибка mark_read:", error);
      }
    });

    socket.on("disconnect", () => {
      console.log(`Клиент отключился: ${user.userName} (${socket.id})`);
    });
  });
};
