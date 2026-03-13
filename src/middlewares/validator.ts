import { body, validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";

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
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage("Логин может содержать только буквы, цифры, _ и -")
    .escape(),

  body("email")
    .isEmail()
    .withMessage("Некорректный email")
    .isLength({ max: 50 })
    .withMessage("Email не должен превышать 50 символов")
    .normalizeEmail(),

  body("password")
    .isString()
    .isLength({ min: 8, max: 64 })
    .withMessage("Пароль должен быть от 8 до 64 символов")
    .matches(/[0-9]/)
    .withMessage("Пароль должен содержать минимум одну цифру")
    .matches(/[A-Z]/)
    .withMessage("Пароль должен содержать минимум одну заглавную букву")
    .not()
    .matches(/\s/)
    .withMessage("Пароль не должен содержать пробелы"),

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
  body("email")
    .isEmail()
    .withMessage("Некорректный email")
    .isLength({ max: 50 })
    .withMessage("Email не должен превышать 50 символов")
    .normalizeEmail(),

  validate,
];
