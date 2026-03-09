import request from "supertest";
import express from "express";
import cookieParser from "cookie-parser";
import { authRouter } from "../routes/auth-router";

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use("/auth", authRouter);

describe("POST /auth/registration", () => {
  it("должен вернуть 201 при корректных данных", async () => {
    const res = await request(app).post("/auth/registration").send({
      login: "testuser",
      email: "testuser@test.com",
      password: "123456",
    });
    expect(res.status).toBe(201);
  });

  it("должен вернуть 400 при XSS в логине", async () => {
    const res = await request(app).post("/auth/registration").send({
      login: "<script>alert('xss')</script>",
      email: "test@test.com",
      password: "123456",
    });
    expect(res.status).toBe(400);
  });

  it("должен вернуть 400 при некорректном email", async () => {
    const res = await request(app).post("/auth/registration").send({
      login: "testuser",
      email: "notanemail",
      password: "123456",
    });
    expect(res.status).toBe(400);
  });
});

describe("POST /auth/login", () => {
  it("должен вернуть 401 при неверных данных", async () => {
    const res = await request(app).post("/auth/login").send({
      loginOrEmail: "wronguser123",
      password: "wrongpass123",
    });
    expect(res.status).toBe(401);
  });

  it("должен вернуть 400 при пустых полях", async () => {
    const res = await request(app).post("/auth/login").send({
      loginOrEmail: "",
      password: "",
    });
    expect(res.status).toBe(400);
  });
});

describe("POST /auth/refresh", () => {
  it("должен вернуть 401 если нет cookie", async () => {
    const res = await request(app).post("/auth/refresh");
    expect(res.status).toBe(401);
  });

  it("должен вернуть 401 если невалидный refreshToken", async () => {
    const res = await request(app)
      .post("/auth/refresh")
      .set("Cookie", "refreshToken=invalid-token");
    expect(res.status).toBe(401);
  });
});

describe("POST /auth/logout", () => {
  it("должен вернуть 401 если нет cookie", async () => {
    const res = await request(app).post("/auth/logout");
    expect(res.status).toBe(401);
  });

  it("должен вернуть 401 если невалидный refreshToken", async () => {
    const res = await request(app)
      .post("/auth/logout")
      .set("Cookie", "refreshToken=invalid-token");
    expect(res.status).toBe(401);
  });
});

describe("PUT /auth/change-password", () => {
  it("должен вернуть 401 если нет токена", async () => {
    const res = await request(app).put("/auth/change-password").send({
      oldPassword: "123456",
      newPassword: "newpassword123",
    });
    expect(res.status).toBe(401);
  });

  it("должен вернуть 401 если невалидный токен", async () => {
    const res = await request(app)
      .put("/auth/change-password")
      .set("Authorization", "Bearer invalid-token")
      .send({
        oldPassword: "123456",
        newPassword: "newpassword123",
      });
    expect(res.status).toBe(401);
  });
});
