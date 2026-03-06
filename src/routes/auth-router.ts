import { Request, Response, Router } from "express";
import { authService } from "../domain/auth-service";
import { jwtService } from "../application/jwt-service";
import { userRepository } from "../repositories/db-factory";
import { refreshTokenRepository } from "../repositories/refresh-token-repository";
import {
  emailValidator,
  loginValidator,
  registrationValidator,
} from "../middlewares/validator";

export const authRouter = Router({});

/**
 * @swagger
 * /auth/registration:
 *   post:
 *     summary: Регистрация нового пользователя
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [login, email, password]
 *             properties:
 *               login:
 *                 type: string
 *                 example: testuser
 *               email:
 *                 type: string
 *                 example: test@test.com
 *               password:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       201:
 *         description: Пользователь создан
 *       400:
 *         description: Ошибка регистрации
 */
authRouter.post(
  "/registration",
  ...registrationValidator,
  async (req: Request, res: Response) => {
    try {
      await authService.createUser(
        req.body.login,
        req.body.email,
        req.body.password,
      );
      res.status(201).json({ message: "User created. Check your email." });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ error: "Registration failed" });
    }
  },
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Авторизация пользователя
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [loginOrEmail, password]
 *             properties:
 *               loginOrEmail:
 *                 type: string
 *                 example: testuser
 *               password:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Возвращает accessToken и устанавливает refreshToken в httpOnly cookie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiJ9...
 *       401:
 *         description: Неверные данные
 *       500:
 *         description: Ошибка сервера
 */
authRouter.post(
  "/login",
  ...loginValidator,
  async (req: Request, res: Response) => {
    try {
      const user = await authService.checkCredentials(
        req.body.loginOrEmail,
        req.body.password,
      );
      if (!user) return res.sendStatus(401);

      const accessToken = await jwtService.createAccessToken(user);
      const refreshToken = await jwtService.createRefreshToken(user);

      await refreshTokenRepository.saveToken(String(user._id), refreshToken);

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      return res.status(200).json({ accessToken });
    } catch (error) {
      console.error("Login error:", error);
      return res.sendStatus(500);
    }
  },
);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Обновление accessToken с помощью refreshToken
 *     tags: [Auth]
 *     description: refreshToken берётся автоматически из httpOnly cookie
 *     responses:
 *       200:
 *         description: Возвращает новый accessToken и обновляет refreshToken в cookie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiJ9...
 *       401:
 *         description: Невалидный или отсутствующий refreshToken
 *       500:
 *         description: Ошибка сервера
 */
authRouter.post("/refresh", async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) return res.sendStatus(401);

    const result = await authService.refreshTokens(refreshToken);
    if (!result) return res.sendStatus(401);

    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({ accessToken: result.accessToken });
  } catch (error) {
    console.error("Refresh error:", error);
    return res.sendStatus(500);
  }
});

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Выход из системы
 *     tags: [Auth]
 *     description: Удаляет refreshToken из БД и очищает cookie
 *     responses:
 *       204:
 *         description: Успешный выход
 *       401:
 *         description: Невалидный или отсутствующий refreshToken
 *       500:
 *         description: Ошибка сервера
 */
authRouter.post("/logout", async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) return res.sendStatus(401);

    const result = await authService.logout(refreshToken);
    if (!result) return res.sendStatus(401);

    res.clearCookie("refreshToken");
    return res.sendStatus(204);
  } catch (error) {
    console.error("Logout error:", error);
    return res.sendStatus(500);
  }
});

/**
 * @swagger
 * /auth/resend-registration-code:
 *   post:
 *     summary: Повторная отправка кода подтверждения
 *     tags: [Auth]
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
 *     responses:
 *       204:
 *         description: Код отправлен
 *       400:
 *         description: Ошибка отправки
 *       429:
 *         description: Слишком много попыток
 */
authRouter.post(
  "/resend-registration-code",
  ...emailValidator,
  async (req: Request, res: Response) => {
    try {
      const resultEmail = await authService.resendConfirmationCode(
        req.body.email,
      );
      if (resultEmail) {
        res.sendStatus(204);
      } else {
        res.sendStatus(400);
      }
    } catch (error: any) {
      if (error.message === "RATE_LIMIT") {
        res.status(429).json({ error: "Too many attempts. Wait 15 minutes." });
      } else {
        res.sendStatus(500);
      }
    }
  },
);

/**
 * @swagger
 * /auth/confirm:
 *   get:
 *     summary: Подтверждение email
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         example: abc123
 *       - in: query
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *         example: test@test.com
 *     responses:
 *       200:
 *         description: Email подтверждён
 *       400:
 *         description: Неверный или просроченный код
 */
authRouter.get("/confirm", async (req: Request, res: Response) => {
  const confirmed = await authService.confirmEmail(
    req.query.code as string,
    req.query.email as string,
  );
  if (confirmed) {
    res.send("<h1>Email confirmed!</h1>");
  } else {
    res.status(400).send("<h1>Invalid or expired code</h1>");
  }
});

/**
 * @swagger
 * /auth/delete-account/{email}:
 *   delete:
 *     summary: Удаление аккаунта по email
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *         example: test@test.com
 *     responses:
 *       204:
 *         description: Аккаунт удалён
 *       404:
 *         description: Пользователь не найден
 */
authRouter.delete(
  "/delete-account/:email",
  async (req: Request, res: Response) => {
    const result = await userRepository.deleteByEmail(
      req.params.email as string,
    );
    if (result) {
      res.sendStatus(204);
    } else {
      res.sendStatus(404);
    }
  },
);
