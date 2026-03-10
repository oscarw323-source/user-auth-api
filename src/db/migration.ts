import pool from "./postgres";
import bcrypt from "bcrypt";

export const runMigrations = async () => {
  await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        user_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        password_salt VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        avatar_url VARCHAR(255),
        confirmation_code VARCHAR(255),
        expiration_date TIMESTAMP,
        is_confirmed BOOLEAN DEFAULT false
    );
    `);

  await pool.query(
    ` ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';`,
  );

  await pool.query(`
        CREATE TABLE IF NOT EXISTS refresh_tokens (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        token VARCHAR(512) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP NOT NULL
    );
    `);
  await createSuperAdminIfNotExists();
  console.log("✅ Migrations completed");
};

const createSuperAdminIfNotExists = async () => {
  const login = process.env.SUPER_ADMIN_LOGIN;
  const email = process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD;

  if (!login || !email || !password) return;

  const existing = await pool.query(
    `SELECT id FROM users WHERE role = 'super_admin'`,
  );
  if (existing.rows.length > 0) return;

  const passwordHash = await bcrypt.hash(password, 10);

  await pool.query(
    `INSERT INTO users (user_name, email, password_hash, password_salt, is_confirmed, role, avatar_url, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
    [
      login,
      email,
      passwordHash,
      "",
      true,
      "super_admin",
      `https://api.dicebear.com/7.x/personas/svg?seed=${login}`,
    ],
  );

  console.log("✅ Super admin created");
};
