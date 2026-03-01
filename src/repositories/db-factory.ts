import { IUserRepository } from "./interfaces/IUserRepository";

const DB_TYPE = process.env.DB_TYPE || "mongo";

const getUserRepository = (): IUserRepository => {
  if (DB_TYPE === "postgres") {
    const { userRepository } = require("./postgres/user-postgres-repository");
    return userRepository;
  } else {
    const { userRepository } = require("./mongo/user-mongo-repository");
    return userRepository;
  }
};

export const userRepository = getUserRepository();
