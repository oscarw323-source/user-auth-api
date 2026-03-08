import { Request, Response, Router } from "express";
import { authService } from "../domain/auth-service";
import { userService } from "../domain/users-service";
import { authMidelware, requireAdmin } from "../middlewares/auth-middleware"; // ← добавили импорт

export const usersRouter = Router({});

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Создать пользователя (admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
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
 *       401:
 *         description: Не авторизован
 *       403:
 *         description: Нет доступа (не админ)
 */
// ← добавили authMidelware и requireAdmin
usersRouter.post(
  "/",
  authMidelware,
  requireAdmin,
  async (req: Request, res: Response) => {
    const newUser = await authService.createUser(
      req.body.login,
      req.body.email,
      req.body.password,
    );
    res.status(201).send(newUser);
  },
);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Получить пользователей с пагинацией (admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Номер страницы
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Количество пользователей на странице
 *     responses:
 *       200:
 *         description: Список пользователей с пагинацией
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                 totalCount:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 pagesCount:
 *                   type: integer
 *       401:
 *         description: Не авторизован
 *       403:
 *         description: Нет доступа (не админ)
 */

usersRouter.get(
  "/",
  authMidelware,
  requireAdmin,
  async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const users = await userService.getAllUsers(page, limit);
    res.status(200).send(users);
  },
);
