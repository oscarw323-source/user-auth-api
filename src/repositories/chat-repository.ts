import { messageCollection } from "../db/db";
import { MessageDBType } from "./types";
import { ObjectId } from "mongodb";

export const chatRepository = {
  async createMessage(newMessage: MessageDBType): Promise<MessageDBType> {
    await messageCollection.insertOne(newMessage);
    return newMessage;
  },

  async getAllMessages(limit: number = 50): Promise<MessageDBType[]> {
    return messageCollection
      .find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
  },

  async getMessageById(id: ObjectId): Promise<MessageDBType | null> {
    return messageCollection.findOne({ _id: id });
  },

  async deleteMessages(id: ObjectId): Promise<boolean> {
    const result = await messageCollection.deleteOne({ _id: id });
    return result.deletedCount === 1;
  },
  async clearAllMessages(): Promise<boolean> {
    const result = await messageCollection.deleteMany({});
    return result.deletedCount > 0;
  },
  async getMessagesSince(date: Date): Promise<MessageDBType[]> {
    return messageCollection
      .find({ createdAt: { $gte: date } })
      .sort({ createdAt: 1 })
      .toArray();
  },
};
