import { Router, Request, Response } from "express";
import { authMidelware } from "../middlewares/auth-middleware";
import { feedbackService } from "../domain/feedback-service";
import { usersDBType } from "../repositories/types";

interface AuthRequest extends Request {
  user: usersDBType | null;
}

export const feedbackRouter = Router({});

feedbackRouter.post("/", authMidelware, async (req, res) => {
  const authReq = req as AuthRequest;
  const newProduct = await feedbackService.sendFeedback(
    req.body.comment,
    authReq.user!._id,
  );
  res.status(201).send(newProduct);
});

feedbackRouter.get("/", async (req, res) => {
  const feedbacks = await feedbackService.getAllFeedbacks();
  res.send(feedbacks);
});
