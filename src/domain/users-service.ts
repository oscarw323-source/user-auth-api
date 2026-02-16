import { userRepository } from "../repositories/user-repository";
import { usersDBType } from "../repositories/types";
import { ObjectId } from "mongodb";

export const userService = {
  async findUserById(id: ObjectId): Promise<usersDBType | null> {
    return userRepository.findUserById(id);
  },

  async getAllUsers(): Promise<usersDBType[]> {
    return userRepository.getAllUsers();
  },
};
