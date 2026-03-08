import { usersDBType, DbId } from "../repositories/types";
import { ObjectId } from "mongodb";
import jwt, { Jwt, JwtPayload } from "jsonwebtoken";
import { settings } from "../seting/settings";

type JwtPayloadDefault = Jwt | JwtPayload | string;
type JwtPayloadWithUserId = JwtPayloadDefault & { userId: string };

const parseUserId = (userId: string): DbId => {
  if (!isNaN(Number(userId))) return Number(userId);

  return new ObjectId(userId);
};

export const jwtService = {
  async createAccessToken(user: usersDBType<DbId>) {
    return jwt.sign(
      { userId: user._id, role: user.role },
      settings.JWT_SECRET,
      { expiresIn: "15m" },
    );
  },

  async createRefreshToken(user: usersDBType<DbId>) {
    return jwt.sign({ userId: user._id }, settings.JWT_REFRESH_SECRET, {
      expiresIn: "30d",
    });
  },

  async createJWT(user: usersDBType<DbId>) {
    return this.createAccessToken(user);
  },

  async getUserIdByToken(token: string) {
    try {
      const result = jwt.verify(
        token,
        settings.JWT_SECRET,
      ) as JwtPayloadWithUserId;

      if (!result.userId) return null;
      return parseUserId(String(result.userId));
    } catch (error) {
      return null;
    }
  },

  async getUserIdByRefreshToken(token: string) {
    try {
      const result = jwt.verify(
        token,
        settings.JWT_REFRESH_SECRET,
      ) as JwtPayloadWithUserId;

      if (!result.userId) return null;
      return parseUserId(String(result.userId));
    } catch (error) {
      return null;
    }
  },
};
