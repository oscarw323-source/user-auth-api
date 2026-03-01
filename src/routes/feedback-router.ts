import { Router, Request, Response } from "express";
import { authMidelware } from "../middlewares/auth-middleware";
import { feedbackService } from "../domain/feedback-service";
import { usersDBType } from "../repositories/types";

interface AuthRequest extends Request {
  user: usersDBType | null;
}

export const feedbackRouter = Router({});

/**
 * @swagger
 * /feedback:
 *   post:
 *     summary: Отправить отзыв
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [comment]
 *             properties:
 *               comment:
 *                 type: string
 *                 example: Отличный проект!
 *     responses:
 *       201:
 *         description: Отзыв создан
 *       401:
 *         description: Unauthorized
 */

feedbackRouter.post("/", authMidelware, async (req, res) => {
  const authReq = req as AuthRequest;
  const newProduct = await feedbackService.sendFeedback(
    req.body.comment,
    authReq.user!._id,
  );
  res.status(201).send(newProduct);
});
/**
 * @swagger
 * /feedback:
 *   get:
 *     summary: Получить все отзывы
 *     tags: [Feedback]
 *     responses:
 *       200:
 *         description: Список отзывов
 */

feedbackRouter.get("/", async (req, res) => {
  const feedbacks = await feedbackService.getAllFeedbacks();
  res.send(feedbacks);
});
