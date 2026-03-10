import { NextFunction, Request, Response } from "express";

type RateLimitRecord = {
  count: number;
  resetAt: number;
};

const store = new Map<string, RateLimitRecord>();

export const rateLimitMiddleware = (
  maxRequests: number,
  windowMs: number = 15 * 60 * 1000,
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip ?? "unknown";
    const now = Date.now();

    const record = store.get(ip);

    if (!record || now > record.resetAt) {
      store.set(ip, { count: 1, resetAt: now + windowMs });
      return next();
    }
    if (record.count >= maxRequests) {
      return res.status(429).json({ error: "Too many requests. Try later." });
    }
    record.count++;
    return next();
  };
};
