import { userRepository } from "../repositories/db-factory";
import { usersDBType, DbId } from "../repositories/types";
import { cacheService } from "../cache/cache-service";

const CACHE_KEY = {
  ALL_USERS: "all_users",
};

export const userService = {
  async findUserById(id: DbId): Promise<usersDBType<DbId> | null> {
    return userRepository.findUserById(id);
  },

  async getAllUsers(): Promise<usersDBType<DbId>[] | usersDBType<number>[]> {
    const cached = cacheService.get<usersDBType<DbId>[]>(CACHE_KEY.ALL_USERS);
    if (cached) {
      console.log("← getAllUsers из кэша");
      return cached;
    }

    const users = await userRepository.getAllUsers();
    cacheService.set(CACHE_KEY.ALL_USERS, users, 60);
    console.log("← getAllUsers из БД");
    return users;
  },
};
