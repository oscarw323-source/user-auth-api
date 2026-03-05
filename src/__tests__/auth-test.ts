import request from "supertest";
import express from "express";
import { authRouter } from "../routes/auth-router";

const app = express();

app.use(express.json());
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
      logginOrEmail: "",
      password: "",
    });
    expect(res.status).toBe(400);
  });
});
