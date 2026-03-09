import { usersDBType, DbId } from "../types";

export interface IUserRepository {
  createUser(user: usersDBType<DbId>): Promise<usersDBType<DbId>>;
  findUserById(id: DbId): Promise<usersDBType<DbId> | null>;
  findByLoginOrEmail(loginOrEmail: string): Promise<usersDBType<DbId> | null>;
  getAllUsers(page: number, limit: number): Promise<usersDBType<DbId>[]>;
  getUserCount(): Promise<number>;
  updateConfirmation(userId: DbId): Promise<boolean>;
  updatePassword(userId: DbId, newPasswordHash: string): Promise<boolean>;
  deleteByEmail(email: string): Promise<boolean>;
}
