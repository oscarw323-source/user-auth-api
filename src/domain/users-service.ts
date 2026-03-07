import { userRepository } from "../repositories/db-factory";
import { usersDBType, DbId } from "../repositories/types";
import { cacheService } from "../cache/cache-service";

const CACHE_KEY = {
  ALL_USERS: "all_users",
};

export type PaginatedUsers = {
  items: usersDBType<DbId>[] | usersDBType<number>[];
  totalCount: number;
  page: number;
  limit: number;
  pagesCount: number;
};

export const userService = {
  async findUserById(id: DbId): Promise<usersDBType<DbId> | null> {
    return userRepository.findUserById(id);
  },

  async getAllUsers(page: number, limit: number): Promise<PaginatedUsers> {
    const cacheKey = `${CACHE_KEY.ALL_USERS}_${page}_${limit}`;
    const cached = cacheService.get<PaginatedUsers>(cacheKey);
    if (cached) {
      console.log("← getAllUsers из кэша");
      return cached;
    }
    const [items, totalCount] = await Promise.all([
      userRepository.getAllUsers(page, limit),
      userRepository.getUserCount(),
    ]);

    const result: PaginatedUsers = {
      items,
      totalCount,
      page,
      limit,
      pagesCount: Math.ceil(totalCount / limit),
    };

    cacheService.set(cacheKey, result, 60);

    console.log("← getAllUsers из БД");
    return result;
  },
};
