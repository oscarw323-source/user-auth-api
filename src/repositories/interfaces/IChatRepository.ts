import { MessageDBType } from "../types";
import { ObjectId } from "mongodb";

export interface IChatRepository {
  createMessage(message: MessageDBType): Promise<MessageDBType>;
  getAllMessages(limit?: number): Promise<MessageDBType[]>;
  getMessages(chatId: string): Promise<MessageDBType | null>;
  deleteMessages(id: ObjectId): Promise<boolean>;
  clearAllMessages(): Promise<boolean>;
  getMessageSince(date: Date): Promise<MessageDBType[]>;
}
