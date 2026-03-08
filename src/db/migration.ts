import pool from "./postgres";

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
  console.log("✅ Migrations completed");
};
