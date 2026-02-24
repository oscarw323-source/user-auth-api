import { ObjectId } from "mongodb";
import { directChatRepository } from "../repositories/direct-chat-repository";
import { DirectMessageDBType } from "../repositories/types";

export const directChatService = {
  async sendMessage(
    fromUserId: ObjectId,
    fromUserName: string,
    fromAvatarUrl: string,
    toUserId: ObjectId,
    toUserName: string,
    message: string,
    fileUrl?: string,
    fileType?: "image" | "video" | "audio" | "raw",
    fileName?: string,
  ): Promise<DirectMessageDBType> {
    const chatId = directChatRepository.getChatId(fromUserId, toUserId);
    const newMessage: DirectMessageDBType = {
      _id: new ObjectId(),
      fromUserId,
      fromUserName,
      fromAvatarUrl,
      toUserId,
      toUserName,
      message,
      createdAt: new Date(),
      fileUrl,
      fileType,
      fileName,
      chatId,
      isRead: false,
    };
    return directChatRepository.createMessage(newMessage);
  },
  async getMessages(userId1: ObjectId, userId2: ObjectId) {
    const chatId = directChatRepository.getChatId(userId1, userId2);
    return directChatRepository.getMessages(chatId);
  },
  async clearMessages(userId1: ObjectId, userId2: ObjectId) {
    const chatId = directChatRepository.getChatId(userId1, userId2);
    return directChatRepository.clearMessages(chatId);
  },
  async getUserChats(userId: ObjectId) {
    return directChatRepository.getUserChats(userId);
  },
  async markAsRead(userId1: ObjectId, userId2: ObjectId) {
    const chatId = directChatRepository.getChatId(userId1, userId2);
    return directChatRepository.markAsRead(chatId, userId1);
  },
};
