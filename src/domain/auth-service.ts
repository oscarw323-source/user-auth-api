import { userRepository } from "../repositories/db-factory";
import { usersDBType, DbId, JwtPayload } from "../repositories/types";
import { ObjectId } from "mongodb";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { settings } from "../seting/settings";
import { userService } from "./users-service";
import { v4 as uuidv4 } from "uuid";
import { add } from "date-fns";
import { emailManager } from "../managers/email-manager";
import { cacheService } from "../cache/cache-service";

const emailAttempts: Map<string, { count: number; firstAttempt: Date }> =
  new Map();

export const authService = {
  async createUser(
    login: string,
    email: string,
    password: string,
  ): Promise<usersDBType<DbId> | null> {
    const passwordHash = await this._generateHash(password);

    const newUser: usersDBType<ObjectId> = {
      _id: new ObjectId(),
      userName: login,
      email,
      passwordHash,
      passwordSalt: "",
      createdAt: new Date(),
      avatarUrl: `https://api.dicebear.com/7.x/personas/svg?seed=${login}`,
      emailConfirmation: {
        confirmationCode: uuidv4(),
        expirationDate: add(new Date(), {
          hours: 10,
          minutes: 3,
        }),
        isConfirmed: true,
      },
    };

    const createResult = await userRepository.createUser(newUser);
    cacheService.delete("all_users");
    return createResult;
  },

  async checkCredentials(loginOrEmail: string, password: string) {
    const user = await userRepository.findByLoginOrEmail(loginOrEmail);
    if (!user) return null;

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return null;

    return user;
  },

  async _generateHash(password: string) {
    return bcrypt.hash(password, 10);
  },

  async _isPasswordCorrect(password: string, hash: string) {
    return bcrypt.compare(password, hash);
  },

  async checkAndFindUserByToken(token: string) {
    try {
      const decoded = jwt.verify(token, settings.JWT_SECRET);
      if (
        typeof decoded === "object" &&
        decoded !== null &&
        "userId" in decoded
      ) {
        return userService.findUserById(new ObjectId(decoded.userId as string));
      }
      return null;
    } catch (error) {
      return null;
    }
  },

  async confirmEmail(code: string, email: string): Promise<boolean> {
    const user = await userRepository.findByLoginOrEmail(email);

    if (!user) return false;
    if (user.emailConfirmation.isConfirmed) return false;
    if (user.emailConfirmation.confirmationCode !== code) return false;
    if (user.emailConfirmation.expirationDate < new Date()) return false;

    return await userRepository.updateConfirmation(user._id);
  },

  async resendConfirmationCode(email: string): Promise<boolean> {
    const user = await userRepository.findByLoginOrEmail(email);

    if (!user) return false;
    if (user.emailConfirmation.isConfirmed) return false;

    const attempts = emailAttempts.get(email);
    const now = new Date();

    if (attempts) {
      const minutesPassed =
        (now.getTime() - attempts.firstAttempt.getTime()) / 1000 / 60;

      if (minutesPassed < 15) {
        if (attempts.count >= 3) {
          throw new Error("RATE_LIMIT");
        }
        attempts.count++;
      } else {
        emailAttempts.set(email, { count: 1, firstAttempt: now });
      }
    } else {
      emailAttempts.set(email, { count: 1, firstAttempt: now });
    }
    await emailManager.sendEmailConfirmationMessage(user);
    return true;
  },
};
