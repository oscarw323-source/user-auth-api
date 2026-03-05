import { body, validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";
import { escape } from "node:querystring";

export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }
  next();
};
export const registrationValidator = [
  body("login")
    .isString()
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage("Логин должен быть от 3 до 20 символов")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Логин может содержать только буквы, цифры и _")
    .escape(),

  body("email").isEmail().withMessage("Некорректный email").normalizeEmail(),

  body("password")
    .isString()
    .isLength({ min: 6, max: 50 })
    .withMessage("Пароль должен быть от 6 до 50 символов"),

  validate,
];

export const loginValidator = [
  body("loginOrEmail")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Логин или email обязателен")
    .escape(),

  body("password").isString().notEmpty().withMessage("Пароль обязателен"),

  validate,
];

export const emailValidator = [
  body("email").isEmail().withMessage("Некорректный email").normalizeEmail(),

  validate,
];
