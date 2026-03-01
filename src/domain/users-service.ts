import { userRepository } from "../repositories/db-factory";
import { usersDBType, DbId } from "../repositories/types";

export const userService = {
  async findUserById(id: DbId): Promise<usersDBType<DbId> | null> {
    return userRepository.findUserById(id);
  },

  async getAllUsers(): Promise<usersDBType<DbId>[] | usersDBType<number>[]> {
    return userRepository.getAllUsers();
  },
};
