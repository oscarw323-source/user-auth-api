import { usersDBType } from "../repositories/types";

declare global {
  namespace Express {
    interface Request {
      user: usersDBType | null;
    }
  }
}

export {};
