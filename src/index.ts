import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { logger } from "./logger";

import { usersRouter } from "./routes/users-router";
import { authRouter } from "./routes/auth-router";
import { feedbackRouter } from "./routes/feedback-router";
import { emailRouter } from "./routes/email-router";
import { runDb } from "./db/mongo";
import { runPostgres } from "./db/postgres";
import { runMigrations } from "./db/migration";
import { setupChatHandlers } from "./socket/chat-handler";
import { chatRouter } from "./routes/chat-router";
import { uploadRouter } from "./routes/upload-router";
import { rateLimitMiddleware } from "./middlewares/rate-limit-middleware";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { loadSecrets } from "./config/aws-secrets";

const app = express();
app.use(helmet({ contentSecurityPolicy: false }));
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const port = 5001;

app.use(express.json());
app.use(cookieParser());
app.use(rateLimitMiddleware(100));

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "User Auth API",
      version: "1.0.0",
      description: "Api для аунтификации пользователей с JWT и MongoDB",
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis:
    process.env.NODE_ENV === "production"
      ? ["/app/src/routes/*.ts"]
      : ["./src/routes/*.ts"],
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

const swaggerAuthOptions = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Basic")) {
    res.setHeader("WWW-Authenticate", 'Basic realm="Swagger Docs"');
    res.status(401).send("Unauthorized");
    return;
  }
  const base64 = auth.split(" ")[1];
  const decoded = Buffer.from(base64, "base64").toString("utf-8");
  const [user, pass] = decoded.split(":");
  const validUser = process.env.SWAGGER_USER || "admin";
  const validPass = process.env.SWAGGER_PASS || "password";
  if (user === validUser && pass === validPass) {
    next();
  } else {
    res.setHeader("WWW-Authenticate", 'Basic realm="Swagger Docs"');
    res.status(401).send("Unauthorized");
  }
};

app.use(
  "/api-docs",
  swaggerAuthOptions,
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec),
);
app.use(express.static(path.join(__dirname, "../public")));
app.use("/users", usersRouter);
app.use("/auth", authRouter);
app.use("/feedback", feedbackRouter);
app.use("/email", emailRouter);
app.use("/chat", chatRouter);
app.use("/upload", uploadRouter);

setupChatHandlers(io);

const startApp = async () => {
  if (process.env.NODE_ENV === "production") {
    await loadSecrets();
  }

  if (process.env.DB_TYPE === "postgres") {
    await runPostgres();
    await runMigrations();
  } else {
    await runDb();
  }

  await new Promise<void>((resolve) => {
    httpServer.listen(port, () => {
      logger.info(`🚀 Server running on http://localhost:${port}`);
      logger.info(`💬 WebSocket ready on ws://localhost:${port}`);
      logger.info(`📄 Chat UI available at http://localhost:${port}`);
      resolve();
    });
  });

  if (process.env.NODE_ENV !== "production") {
    try {
      const ngrok = await import("@ngrok/ngrok");
      const listener = await ngrok.forward({
        addr: port,
        authtoken: process.env.NGROK_AUTHTOKEN,
      });
      const url = listener.url();
      logger.info(`🌐 Public ngrok URL: ${url}`);
      logger.info(`💬 WebSocket via ngrok: ${url}`);
      logger.info(`📄 Chat UI via ngrok: ${url}`);
    } catch (err) {
      if (err instanceof Error) {
        logger.error(`❌ ngrok failed: ${err.message}`);
      } else {
        logger.error({ err }, "❌ ngrok failed");
      }
    }
  }
};

startApp();

process.on("SIGINT", async () => {
  logger.info("👋 Shutting down...");
  if (process.env.NODE_ENV !== "production") {
    try {
      const ngrok = await import("@ngrok/ngrok");
      await ngrok.disconnect();
    } catch {}
  }
  process.exit(0);
});
