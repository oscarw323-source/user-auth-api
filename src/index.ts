import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";

import ngrok from "ngrok";

import { usersRouter } from "./routes/users-router";
import { authRouter } from "./routes/auth-router";
import { feedbackRouter } from "./routes/feedback-router";
import { emailRouter } from "./routes/email-router";
import { runDb } from "./db/db";
import { setupChatHandlers } from "./socket/chat-handler";
import { chatRouter } from "./routes/chat-router";
import { uploadRouter } from "./routes/upload-router";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const port = 5001;

app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

app.use("/users", usersRouter);
app.use("/auth", authRouter);
app.use("/feedback", feedbackRouter);
app.use("/email", emailRouter);
app.use("/chat", chatRouter);
app.use("/upload", uploadRouter);

setupChatHandlers(io);

const startApp = async () => {
  await runDb();

  await new Promise<void>((resolve) => {
    httpServer.listen(port, () => {
      console.log(`🚀 Server running on http://localhost:${port}`);
      console.log(`💬 WebSocket ready on ws://localhost:${port}`);
      console.log(`📄 Chat UI available at http://localhost:${port}`);
      resolve();
    });
  });

  try {
    await ngrok.kill();

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const url = await ngrok.connect({
      addr: port,
      authtoken: process.env.NGROK_AUTHTOKEN,
    });

    console.log(`🌐 Public ngrok URL: ${url}`);
    console.log(`💬 WebSocket via ngrok: ${url.replace(/^http/, "ws")}`);
    console.log(`📄 Chat UI via ngrok: ${url}`);
  } catch (err) {
    if (err instanceof Error) {
      console.error("❌ ngrok failed:", err.message);
    } else {
      console.error("❌ ngrok failed:", err);
    }
  }
};

startApp();

process.on("SIGINT", async () => {
  console.log("\n👋 Shutting down...");
  await ngrok.kill();
  process.exit(0);
});
