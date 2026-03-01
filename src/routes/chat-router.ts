import { Request, Response, Router } from "express";
import { chatService } from "../domain/chat-service";

export const chatRouter = Router({});

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
