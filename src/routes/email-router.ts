import { Request, Response, Router } from "express";
import { businessService } from "../domain/buisness-service";

export const emailRouter = Router({});

emailRouter.post("/send", async (req: Request, res: Response) => {
  try {
    const user = {
      email: req.body.email,
      recoveryCode: req.body.recoveryCode || "123456",
    };

    console.log("User object:", user);

    await businessService.doOperation(user);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Email error:", error);
    res.status(500).json({ error: "Failed to send email" });
  }
});
