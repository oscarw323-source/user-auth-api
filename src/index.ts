import dotenv from "dotenv";
dotenv.config();

import { loadSecrets } from "./config/aws-secrets";

const bootstrap = async () => {
  if (process.env.NODE_ENV === "production") {
    await loadSecrets();
  }

  const { default: express } = await import("express");
  const { createServer } = await import("http");
  const { Server } = await import("socket.io");
  const { default: path } = await import("path");
  const { default: swaggerJSDoc } = await import("swagger-jsdoc");
  const swaggerUi = await import("swagger-ui-express");
  const { logger } = await import("./logger");
  const { usersRouter } = await import("./routes/users-router");
  const { authRouter } = await import("./routes/auth-router");
  const { feedbackRouter } = await import("./routes/feedback-router");
  const { emailRouter } = await import("./routes/email-router");
  const { runDb } = await import("./db/mongo");
  const { runPostgres } = await import("./db/postgres");
  const { runMigrations } = await import("./db/migration");
  const { setupChatHandlers } = await import("./socket/chat-handler");
  const { chatRouter } = await import("./routes/chat-router");
  const { uploadRouter } = await import("./routes/upload-router");
  const { rateLimitMiddleware } =
    await import("./middlewares/rate-limit-middleware");
  const { default: helmet } = await import("helmet");
  const { default: cookieParser } = await import("cookie-parser");

  const app = express();
  app.use(helmet({ contentSecurityPolicy: false }));
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
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
          bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
        },
      },
    },
    apis:
      process.env.NODE_ENV === "production"
        ? ["/app/src/routes/*.ts"]
        : ["./src/routes/*.ts"],
  };

  const swaggerSpec = swaggerJSDoc(swaggerOptions);
  const swaggerAuthOptions = (req: any, res: any, next: any) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith("Basic")) {
      res.setHeader("WWW-Authenticate", 'Basic realm="Swagger Docs"');
      res.status(401).send("Unauthorized");
      return;
    }
    const [user, pass] = Buffer.from(auth.split(" ")[1], "base64")
      .toString("utf-8")
      .split(":");
    if (
      user === (process.env.SWAGGER_USER || "admin") &&
      pass === (process.env.SWAGGER_PASS || "password")
    ) {
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
    } catch (err) {
      logger.error(
        `❌ ngrok failed: ${err instanceof Error ? err.message : err}`,
      );
    }
  }

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
};

bootstrap();
