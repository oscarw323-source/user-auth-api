import { chatRepository } from "../repositories/chat-repository";
import { MessageDBType } from "../repositories/types";
import { ObjectId } from "mongodb";

export const chatService = {
  async sendMessage(
    userId: ObjectId,
    userName: string,
    avatarUrl: string,
    message: string,
    fileUrl?: string,
    fileType?: "image" | "video" | "audio" | "raw",
    fileName?: string,
  ): Promise<MessageDBType> {
    const newMessage: MessageDBType = {
      _id: new ObjectId(),
      userId,
      userName,
      avatarUrl,
      message,
      createdAt: new Date(),
      fileUrl,
      fileType,
      fileName,
    };
    return chatRepository.createMessage(newMessage);
  },

  async getAllMessages(limit: number = 50): Promise<MessageDBType[]> {
    const message = await chatRepository.getAllMessages(limit);
    return message.reverse();
  },

  async getAllMessagesSince(date: Date): Promise<MessageDBType[]> {
    return chatRepository.getMessagesSince(date);
  },

  async deleteMessage(messageId: ObjectId): Promise<boolean> {
    return chatRepository.deleteMessages(messageId);
  },

  async clearAllMesage(): Promise<boolean> {
    return chatRepository.clearAllMessages();
  },
};
