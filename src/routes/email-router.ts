import { Request, Response, Router } from "express";
import { businessService } from "../domain/buisness-service";

export const emailRouter = Router({});

/**
 * @swagger
 * /email/send:
 *   post:
 *     summary: Отправка email с кодом восстановления
 *     tags: [Email]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 example: test@test.com
 *               recoveryCode:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Письмо отправлено
 *       500:
 *         description: Ошибка отправки
 */
emailRouter.post("/send", async (req: Request, res: Response) => {
  try {
    const user = {
      email: req.body.email,
      recoveryCode: req.body.recoveryCode || "123456",
    };

    await businessService.doOperation(user);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Email error:", error);
    res.status(500).json({ error: "Failed to send email" });
  }
});
