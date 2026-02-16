import { usersDBType } from "../repositories/types";
import { ObjectId } from "mongodb";
import jwt, { Jwt, JwtPayload } from "jsonwebtoken";
import { settings } from "../seting/settings";

type JwtPayloadDefault = Jwt | JwtPayload | string;

type JwtPayloadWithUserId = JwtPayloadDefault & { userId: string };

export const jwtService = {
  async createJWT(user: usersDBType) {
    const token = jwt.sign({ userId: user._id }, settings.JWT_SECRET, {
      expiresIn: "1h",
    });
    return token;
  },
  async getUserIdByToken(token: string) {
    try {
      const result = jwt.verify(
        token,
        settings.JWT_SECRET,
      ) as JwtPayloadWithUserId;

      // Дополнительная проверка, чтобы убедиться, что это не просто строка и поле существует
      if (!result.userId) {
        return null;
      }

      return new ObjectId(result.userId);
      // console.log("result", result);
    } catch (error) {
      return null;
    }
  },
};
