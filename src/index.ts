import dotenv from "dotenv";
dotenv.config();
import express from "express";
import { usersRouter } from "./routes/users-router";
import { authRouter } from "./routes/auth-router";
import { runDb } from "./db/db";
import { emailRouter } from "./routes/email-router";
import { feedbackRouter } from "./routes/feedback-router";

const app = express();
const port = 3000;

app.use(express.json());

app.use("/users", usersRouter);
app.use("/auth", authRouter);
app.use("/email", emailRouter);
app.use("/feedback", feedbackRouter);

const startApp = async () => {
  await runDb();

  app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
  });
};

startApp();
