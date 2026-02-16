import { Request, Response, Router } from "express";
import { authService } from "../domain/auth-service";
import { jwtService } from "../application/jwt-service";
import { userRepository } from "../repositories/user-repository";

export const authRouter = Router({});

authRouter.post("/registration", async (req: Request, res: Response) => {
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
});

authRouter.post("/login", async (req: Request, res: Response) => {
  try {
    const user = await authService.checkCredentials(
      req.body.loginOrEmail,
      req.body.password,
    );

    if (user) {
      const token = await jwtService.createJWT(user);
      return res.status(200).json({ token });
    }
    return res.sendStatus(401);
  } catch (error) {
    console.error("Login error:", error);
    return res.sendStatus(500);
  }
});

authRouter.post(
  "/resend-registration-code",
  async (req: Request, res: Response) => {
    try {
      console.log("📧 Resend request for:", req.body.email);
      const resultEmail = await authService.resendConfirmationCode(
        req.body.email,
      );
      console.log("📧 Result:", resultEmail);

      if (resultEmail) {
        res.sendStatus(204);
      } else {
        res.sendStatus(400);
      }
    } catch (error: any) {
      console.error("📧 Error:", error.message);
      if (error.message === "RATE_LIMIT") {
        res.status(429).json({ error: "Too many attempts. Wait 15 minutes." });
      } else {
        res.sendStatus(500);
      }
    }
  },
);

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
