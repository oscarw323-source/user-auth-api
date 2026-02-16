import { usersCollection } from "../db/db";
import { usersDBType } from "./types";
import { ObjectId } from "mongodb";

export const userRepository = {
  async createUser(newUser: usersDBType): Promise<usersDBType> {
    await usersCollection.insertOne(newUser);
    return newUser;
  },

  async findUserById(id: ObjectId): Promise<usersDBType | null> {
    return usersCollection.findOne({ _id: id });
  },

  async findByLoginOrEmail(loginOrEmail: string): Promise<usersDBType | null> {
    return usersCollection.findOne({
      $or: [{ userName: loginOrEmail }, { email: loginOrEmail }],
    });
  },

  async getAllUsers(): Promise<usersDBType[]> {
    return usersCollection.find().sort({ createdAt: -1 }).toArray();
  },
  async updateConfirmation(userId: ObjectId): Promise<boolean> {
    const result = await usersCollection.updateOne(
      { _id: userId },
      { $set: { "emailConfirmation.isConfirmed": true } },
    );
    return result.matchedCount === 1;
  },
  async deleteByEmail(email: string): Promise<boolean> {
    const result = await usersCollection.deleteOne({ email });
    return result.deletedCount === 1;
  },
};
