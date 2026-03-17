import { test, chromium } from "@playwright/test";

const BASE_URL = "http://13.60.191.114:5001";
const USERS_COUNT = 100;

const generateUser = (index: number) => ({
  login: `loaduser${index}`,
  email: `loaduser${index}@test.com`,
  password: "Test123456",
});

test("load test — регистрация, логин, сообщение, удаление 100 пользователей", async () => {
  test.setTimeout(600000);

  const browser = await chromium.launch({ headless: true });

  console.log("📝 Регистрируем пользователей...");
  for (let i = 0; i < USERS_COUNT; i++) {
    const { login, email, password } = generateUser(i);
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(BASE_URL);
    await page.fill("#regLogin", login);
    await page.fill("#regEmail", email);
    await page.fill("#regPassword", password);
    await page.click("button:has-text('Зарегистрироваться')");
    await page.waitForTimeout(500);
    await context.close();

    if (i % 10 === 0) console.log(`✅ Зарегистрировано ${i + 1} пользователей`);
  }

  console.log("💬 Все 100 пользователей заходят одновременно...");

  await Promise.all(
    Array.from({ length: USERS_COUNT }, async (_, i) => {
      const { login, password } = generateUser(i);
      const context = await browser.newContext();
      const page = await context.newPage();

      try {
        await page.goto(BASE_URL);
        await page.fill("#loginInput", login);
        await page.fill("#loginPassword", password);
        await page.click("button:has-text('Войти')");

        await page.waitForSelector("#messageInput:not([disabled])", {
          timeout: 30000,
        });

        await page.fill("#messageInput", `Message from ${login} 🚀`);
        await page.press("#messageInput", "Enter");
        await page.waitForTimeout(500);
        console.log(`💬 ${login} отправил сообщение`);
      } catch (err) {
        console.log(`❌ ${login} упал: ${err}`);
      } finally {
        await context.close();
      }
    }),
  );

  console.log("✅ Все сообщения отправлены");

  console.log("🗑️ Удаляем пользователей...");
  for (let i = 0; i < USERS_COUNT; i++) {
    const { email } = generateUser(i);
    await fetch(`${BASE_URL}/auth/delete-account/${email}`, {
      method: "DELETE",
    });
    if (i % 10 === 0) console.log(`🗑️ Удалено ${i + 1} пользователей`);
  }

  console.log("✅ Тест завершён!");
  await browser.close();
});
