import { Request, Response, NextFunction } from "express";
import { userService } from "../domain/users-service";
import { jwtService } from "../application/jwt-service";
import { usersDBType, DbId } from "../repositories/types";

type AuthRequest = Request & { user?: usersDBType<DbId> | null };

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

export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) return res.sendStatus(401);

  if (req.user.role !== "admin") return res.sendStatus(403);
  next();
};
