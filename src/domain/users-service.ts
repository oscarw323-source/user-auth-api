import { userRepository } from "../repositories/db-factory";
import { usersDBType, DbId, UserRole } from "../repositories/types";
import { cacheService } from "../cache/cache-service";
import { logger } from "../logger";

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

  async getAllUsers(
    page: number,
    limit: number,
    search?: string,
  ): Promise<PaginatedUsers> {
    const cacheKey = `${CACHE_KEY.ALL_USERS}_${page}_${limit}_${search ?? ""}`;
    const cached = cacheService.get<PaginatedUsers>(cacheKey);
    if (cached) {
      logger.info("← getAllUsers из кэша");
      return cached;
    }

    const [items, totalCount] = await Promise.all([
      userRepository.getAllUsers(page, limit, search),
      userRepository.getUserCount(search),
    ]);

    const result: PaginatedUsers = {
      items,
      totalCount,
      page,
      limit,
      pagesCount: Math.ceil(totalCount / limit),
    };

    cacheService.set(cacheKey, result, 60);
    logger.info("← getAllUsers из БД");
    return result;
  },

  async updateProfile(
    userId: DbId,
    login: string,
    email: string,
  ): Promise<usersDBType<DbId> | null> {
    return userRepository.updateProfile(userId, login, email);
  },

  async updateRole(userId: DbId, role: UserRole): Promise<boolean> {
    return userRepository.updateRole(userId, role);
  },
};
