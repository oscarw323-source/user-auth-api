import { ObjectId } from "mongodb";
import { db } from "../db/db";
import { DirectMessageDBType } from "./types";

const getCollection = () =>
  db.collection<DirectMessageDBType>("direct_messages");

export const directChatRepository = {
  getChatId(userId1: ObjectId, userId2: ObjectId): string {
    return [userId1.toString(), userId2.toString()].sort().join("_");
  },

  async createMessage(msg: DirectMessageDBType): Promise<DirectMessageDBType> {
    await getCollection().insertOne(msg);
    return msg;
  },
  async getMessages(chatId: string): Promise<DirectMessageDBType[]> {
    return getCollection().find({ chatId }).sort({ createAt: 1 }).toArray();
  },
  async clearMessages(chatId: string): Promise<void> {
    await getCollection().deleteMany({ chatId });
  },
  async getUserChats(userId: ObjectId): Promise<DirectMessageDBType[]> {
    return getCollection()
      .aggregate([
        {
          $match: {
            $or: [{ fromUserId: userId }, { toUserId: userId }],
          },
        },
        { $sort: { createdAt: -1 } },
        {
          $group: {
            _id: "$chatId",
            lastMessage: { $first: "$$ROOT" },
          },
        },
        { $replaceRoot: { newRoot: "$lastMessage" } },
        { $sort: { createdAt: -1 } },
      ])
      .toArray() as Promise<DirectMessageDBType[]>;
  },
  async markAsRead(chatId: string, userId: ObjectId): Promise<void> {
    await getCollection().updateMany(
      {
        chatId,
        toUserId: userId,
        isRead: false,
      },
      { $set: { isRead: true } },
    );
  },
};
