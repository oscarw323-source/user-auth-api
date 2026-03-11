import { Pool } from "pg";
import { logger } from "../logger";

const pool = new Pool({
  connectionString:
    process.env.POSTGRES_URI || "postgresql://localhost:5432/usersDB",
});

export const runPostgres = async () => {
  try {
    await pool.query("SELECT 1");
    logger.info("✅ Connected to PostgreSQL");
  } catch (error) {
    logger.error({ error }, "❌ PostgreSQL connection failed");
  }
};

export default pool;
