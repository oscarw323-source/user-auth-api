import { usersCollection } from "../../db/mongo";
import { IUserRepository } from "../interfaces/IUserRepository";
import { usersDBType, DbId } from "../types";
import { ObjectId } from "mongodb";

export const userRepository: IUserRepository = {
  async createUser(newUser: usersDBType<DbId>): Promise<usersDBType<DbId>> {
    if (!(newUser._id instanceof ObjectId))
      throw new Error("Invalid ID type for MongoDB");
    await usersCollection.insertOne(newUser as usersDBType<ObjectId>);
    return newUser;
  },

  async findUserById(id: DbId): Promise<usersDBType<DbId> | null> {
    if (!(id instanceof ObjectId)) return null;
    return usersCollection.findOne({ _id: id });
  },

  async findByLoginOrEmail(
    loginOrEmail: string,
  ): Promise<usersDBType<DbId> | null> {
    return usersCollection.findOne({
      $or: [{ userName: loginOrEmail }, { email: loginOrEmail }],
    });
  },

  async getAllUsers(page: number, limit: number): Promise<usersDBType<DbId>[]> {
    const skip = (page - 1) * limit;
    return usersCollection
      .find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
  },

  async getUserCount(): Promise<number> {
    return usersCollection.countDocuments();
  },

  async updateConfirmation(userId: DbId): Promise<boolean> {
    if (!(userId instanceof ObjectId)) return false;
    const result = await usersCollection.updateOne(
      { _id: userId },
      { $set: { "emailConfirmation.isConfirmed": true } },
    );
    return result.matchedCount === 1;
  },
  async updatePassword(
    userId: DbId,
    newPasswordHash: string,
  ): Promise<boolean> {
    if (!(userId instanceof ObjectId)) return false;
    const result = await usersCollection.updateOne(
      { _id: userId },
      { $set: { passwordHash: newPasswordHash } },
    );
    return result.matchedCount === 1;
  },

  async deleteByEmail(email: string): Promise<boolean> {
    const result = await usersCollection.deleteOne({ email });
    return result.deletedCount === 1;
  },
};
