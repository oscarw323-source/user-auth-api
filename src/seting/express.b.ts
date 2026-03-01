import { usersDBType, DbId } from "../repositories/types";

declare global {
  namespace Express {
    interface Request {
      user: usersDBType<DbId> | null;
    }
  }
}

export {};
