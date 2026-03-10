import { Db } from "mongodb";
import { usersDBType, DbId } from "../types";

export interface IUserRepository {
  createUser(user: usersDBType<DbId>): Promise<usersDBType<DbId>>;
  findUserById(id: DbId): Promise<usersDBType<DbId> | null>;
  findByLoginOrEmail(loginOrEmail: string): Promise<usersDBType<DbId> | null>;
  getAllUsers(
    page: number,
    limit: number,
    search?: string,
  ): Promise<usersDBType<DbId>[]>;
  getUserCount(search?: string): Promise<number>;
  updateConfirmation(userId: DbId): Promise<boolean>;
  updatePassword(userId: DbId, newPasswordHash: string): Promise<boolean>;
  updateProfile(
    userId: DbId,
    login: string,
    email: string,
  ): Promise<usersDBType<DbId> | null>;
  deleteByEmail(email: string): Promise<boolean>;
}
