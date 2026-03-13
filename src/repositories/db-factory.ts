import { IUserRepository } from "./interfaces/IUserRepository";

const getUserRepository = (): IUserRepository => {
  const DB_TYPE = process.env.DB_TYPE || "mongo";
  if (DB_TYPE === "postgres") {
    const { userRepository } = require("./postgres/user-postgres-repository");
    return userRepository;
  } else {
    const { userRepository } = require("./mongo/user-mongo-repository");
    return userRepository;
  }
};

let _userRepository: IUserRepository | null = null;

export const userRepository = new Proxy({} as IUserRepository, {
  get(_target, prop) {
    if (!_userRepository) {
      _userRepository = getUserRepository();
    }
    return (_userRepository as any)[prop];
  },
});
