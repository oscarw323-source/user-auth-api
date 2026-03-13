import { Request, Response, Router } from "express";
import { chatService } from "../domain/chat-service";

export const chatRouter = Router({});

/**
 * @swagger
 * /chat/messages:
 *   get:
 *     summary: Получить историю общего чата
 *     tags: [Chat]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Количество сообщений
 *     responses:
 *       200:
 *         description: Список сообщений
 */
chatRouter.get("/messages", async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 50;
  const messages = await chatService.getAllMessages(limit);
  res.status(200).json(messages);
});

/**
 * @swagger
 * /chat/clear-messages:
 *   delete:
 *     summary: Удалить всю историю чата
 *     tags: [Chat]
 *     responses:
 *       200:
 *         description: История удалена
 *       400:
 *         description: Нет сообщений для удаления
 */
chatRouter.delete("/clear-messages", async (req: Request, res: Response) => {
  const result = await chatService.clearAllMesage();
  if (result) {
    res.status(200).json({ message: "История удалена" });
  } else {
    res.status(400).json({ error: "Нет сообщений для удаления" });
  }
});
