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
  console.log("✅ Migrations completed");
};
