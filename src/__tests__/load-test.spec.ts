import { test, chromium } from "@playwright/test";

const BASE_URL = "http://13.60.254.56:5001";
const USERS_COUNT = 100;
const BATCH_SIZE = 5;
const BATCH_DELAY = 20000;

const generateUser = (index: number) => ({
  login: `loaduser${index}`,
  email: `loaduser${index}@test.com`,
  password: "Test123456",
});

test("load test — ramp-up 100 пользователей по 5 каждые 20 секунд", async () => {
  test.setTimeout(1200000);

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

  console.log("💬 Начинаем ramp-up...");
  const activeUsers: Promise<void>[] = [];
  let successCount = 0;
  let failCount = 0;

  const batches = Math.ceil(USERS_COUNT / BATCH_SIZE);

  for (let batch = 0; batch < batches; batch++) {
    const start = batch * BATCH_SIZE;
    const end = Math.min(start + BATCH_SIZE, USERS_COUNT);
    const currentTotal = end;

    console.log(
      `🚀 Запускаем пользователей ${start + 1}-${end} (всего онлайн: ~${currentTotal})`,
    );

    for (let i = start; i < end; i++) {
      const { login, password } = generateUser(i);

      const userPromise = (async () => {
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
          successCount++;
          console.log(
            `💬 ${login} отправил сообщение (успехов: ${successCount})`,
          );

          await page.waitForTimeout(60000);
        } catch (err) {
          failCount++;
          console.log(`❌ ${login} упал (ошибок: ${failCount})`);
        } finally {
          await context.close();
        }
      })();

      activeUsers.push(userPromise);
    }

    if (batch < batches - 1) {
      console.log(
        `⏳ Ждём ${BATCH_DELAY / 1000} секунд перед следующей группой...`,
      );
      await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY));
    }
  }

  console.log("⏳ Ждём завершения всех пользователей...");
  await Promise.all(activeUsers);

  console.log(
    `✅ Тест завершён! Успехов: ${successCount}, Ошибок: ${failCount}`,
  );

  console.log("🗑️ Удаляем пользователей...");
  for (let i = 0; i < USERS_COUNT; i++) {
    const { email } = generateUser(i);
    await fetch(`${BASE_URL}/auth/delete-account/${email}`, {
      method: "DELETE",
    });
    if (i % 10 === 0) console.log(`🗑️ Удалено ${i + 1} пользователей`);
  }

  console.log("✅ Все пользователи удалены!");
  await browser.close();
});
