import { Request, Response, Router } from "express";
import { authService } from "../domain/auth-service";
import { userService } from "../domain/users-service";
import { DbId, usersDBType } from "../repositories/types";
import {
  authMidelware,
  requireAdmin,
  requireSuperAdmin,
} from "../middlewares/auth-middleware";
import { UserRole } from "../repositories/types";

type AuthRequest = Request & { user?: usersDBType<DbId> | null };

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
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Поиск по login или email
 *     responses:
 *       200:
 *         description: Список пользователей с пагинацией
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
    const search = req.query.search as string | undefined;
    const users = await userService.getAllUsers(page, limit, search);
    res.status(200).send(users);
  },
);

/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Получить профиль текущего пользователя
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Профиль пользователя
 *       401:
 *         description: Не авторизован
 */
usersRouter.get(
  "/me",
  authMidelware,
  async (req: AuthRequest, res: Response) => {
    if (!req.user) return res.sendStatus(401);
    return res.status(200).json(req.user);
  },
);

/**
 * @swagger
 * /users/me:
 *   put:
 *     summary: Обновить профиль текущего пользователя
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [login, email]
 *             properties:
 *               login:
 *                 type: string
 *                 example: newlogin
 *               email:
 *                 type: string
 *                 example: new@test.com
 *     responses:
 *       200:
 *         description: Профиль обновлён
 *       401:
 *         description: Не авторизован
 */
usersRouter.put(
  "/me",
  authMidelware,
  async (req: AuthRequest, res: Response) => {
    if (!req.user) return res.sendStatus(401);

    const { login, email } = req.body;
    if (!login || !email) return res.sendStatus(400);

    const updated = await userService.updateProfile(req.user._id, login, email);
    if (!updated) return res.sendStatus(404);

    return res.status(200).json(updated);
  },
);

/**
 * @swagger
 * /users/{id}/role:
 *   put:
 *     summary: Изменить роль пользователя (только super_admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [user, admin, super_admin]
 *                 example: admin
 *     responses:
 *       200:
 *         description: Роль изменена
 *       400:
 *         description: Некорректная роль
 *       401:
 *         description: Не авторизован
 *       403:
 *         description: Нет доступа
 */
usersRouter.put(
  "/:id/role",
  authMidelware,
  requireSuperAdmin,

  async (req: Request, res: Response) => {
    const userId = Number(req.params.id);
    const { role } = req.body;

    const validRoles: UserRole[] = ["user", "admin", "super_admin"];
    if (!validRoles.includes(role)) return res.sendStatus(400);

    const result = await userService.updateRole(userId, role);
    if (!result) return res.sendStatus(404);
    return res.status(200).json({ message: "Role updated" });
  },
);
