import { Request, Response, Router } from "express";
import { chatService } from "../domain/chat-service";
import { error } from "node:console";

export const chatRouter = Router({});

chatRouter.delete("/clear-messages", async (req: Request, res: Response) => {
  const result = await chatService.clearAllMesage();
  if (result) {
    res.status(200).json({ message: "История удалена" });
  } else {
    res.status(400).json({ error: "Нет сообщений для удаления" });
  }
});
