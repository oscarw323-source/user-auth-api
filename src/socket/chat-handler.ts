import { Server, Socket } from "socket.io";
import { chatService } from "../domain/chat-service";
import { jwtService } from "../application/jwt-service";
import { userService } from "../domain/users-service";
import { directChatService } from "../domain/direct-chat-service";
import { directChatRepository } from "../repositories/direct-chat-repository";
import { ObjectId } from "mongodb";

export const setupChatHandlers = (io: Server) => {
  io.on("connection", async (socket: Socket) => {
    console.log("Пользователь подключился:", socket.id);

    const token = socket.handshake.auth.token;

    if (!token) {
      console.log("Нет токена, отключаем:", socket.id);
      socket.emit("error", { message: "Unauthorized: No token provided" });
      socket.disconnect();
      return;
    }

    const userId = await jwtService.getUserIdByToken(token);

    if (!userId) {
      console.log("Невалидный токен, отключаем:", socket.id);
      socket.emit("error", { message: "Unauthorized: Invalid token" });
      socket.disconnect();
      return;
    }

    const user = await userService.findUserById(userId);

    if (!user) {
      console.log("Пользователь не найден, отключаем:", socket.id);
      socket.emit("error", { message: "User not found" });
      socket.disconnect();
      return;
    }

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
          console.log(`Сообщение от ${user.userName}:`, data.message);

          const newMessage = await chatService.sendMessage(
            user._id,
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
        const chatId = directChatRepository.getChatId(user._id, toUserId);
        socket.join(`direct_${chatId}`);

        const messages = await directChatService.getMessages(
          user._id,
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
          const chatId = directChatRepository.getChatId(user._id, toUserId);
          const newMessage = await directChatService.sendMessage(
            user._id,
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
          console.error("Ошибка send _direct", error);
          socket.emit("error", { message: "Failed to send direct message" });
        }
      },
    );

    socket.on("get_direct_chats", async () => {
      try {
        const chats = await directChatService.getUserChats(user._id);
        socket.emit("direct_chats", chats);
      } catch (error) {
        console.error("Ошибка get_direct_chats:", error);
        socket.emit("error", { message: "Failed to send direct message" });
      }
    });

    socket.on("clear_direct", async (data: { toUserId: string }) => {
      try {
        const toUserId = new ObjectId(data.toUserId);
        await directChatService.clearMessages(user._id, toUserId);
        const chatId = directChatRepository.getChatId(user._id, toUserId);
        io.to(`direct_${chatId}`).emit("direct_clered", { chatId });
      } catch (error) {
        console.error("Ошибка clear_chat", error);
      }
    });

    socket.on("typing_direct", (data: { toUserId: string }) => {
      console.log("⌨️ User typing:", user.userName, "→", data.toUserId);
      const toUserId = new ObjectId(data.toUserId);
      const chatId = directChatRepository.getChatId(user._id, toUserId);
      io.to(`direct_${chatId}`).emit("user_typing", {
        userId: user._id.toString(),
        userName: user.userName,
      });
    });

    socket.on("stop_typing_direct", (data: { toUserId: string }) => {
      const toUserId = new ObjectId(data.toUserId);
      const chatId = directChatRepository.getChatId(user._id, toUserId);
      io.to(`direct_${chatId}`).emit("user_stop_typing", {
        userId: user._id.toString(),
      });
    });

    socket.on("mark_read", async (data: { toUserId: string }) => {
      try {
        console.log("📖 Marking as read:", user.userName, "→", data.toUserId);
        const toUserId = new ObjectId(data.toUserId);
        await directChatService.markAsRead(user._id, toUserId);
        const chatId = directChatRepository.getChatId(user._id, toUserId);
        io.to(`direct_${chatId}`).emit("messages_read", {
          userId: user._id.toString(),
        });
        console.log("✅ Marked as read successfully");
      } catch (error) {
        console.error("Ошибка mark_read:", error);
      }
    });

    socket.on("disconnect", () => {
      console.log(`Клиент отключился: ${user.userName} (${socket.id})`);
    });
  });
};
