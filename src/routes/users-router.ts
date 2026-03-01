import { Request, Response, Router } from "express";
import { authService } from "../domain/auth-service";
import { userService } from "../domain/users-service";

export const usersRouter = Router({});

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Создать пользователя (admin)
 *     tags: [Users]
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
 *                 example: newuser
 *               email:
 *                 type: string
 *                 example: new@test.com
 *               password:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       201:
 *         description: Пользователь создан
 */
usersRouter.post("/", async (req: Request, res: Response) => {
  const newUser = await authService.createUser(
    req.body.login,
    req.body.email,
    req.body.password,
  );
  res.status(201).send(newUser);
});

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Получить всех пользователей
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Список пользователей
 */
usersRouter.get("/", async (req: Request, res: Response) => {
  const users = await userService.getAllUsers();
  res.status(200).send(users);
});
