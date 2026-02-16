import { Request, Response, NextFunction } from "express";
import { userService } from "../domain/users-service";
import { jwtService } from "../application/jwt-service";
import { usersDBType } from "../repositories/types";

type AuthRequest = Request & { user?: usersDBType | null };

export const authMidelware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  if (!req.headers.authorization) {
    res.status(401).send({ error: "Unauthorized" });
    return;
  }

  const token = req.headers.authorization.split(" ")[1];
  const userId = await jwtService.getUserIdByToken(token);

  if (!userId) {
    res.status(401).send({ error: "Unauthorized" });
    return;
  }
  req.user = await userService.findUserById(userId);

  next();
};
