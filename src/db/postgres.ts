import { Pool } from "pg";
import { logger } from "../logger";

let pool: Pool;

const getPool = () => {
  if (!pool) {
    pool = new Pool({
      connectionString:
        process.env.POSTGRES_URI || "postgresql://localhost:5432/usersDB",
    });
  }
  return pool;
};

export const runPostgres = async () => {
  try {
    await getPool().query("SELECT 1");
    logger.info("✅ Connected to PostgreSQL");
  } catch (error) {
    logger.error({ error }, "❌ PostgreSQL connection failed");
    throw error;
  }
};

export default {
  query: (...args: Parameters<Pool["query"]>) => getPool().query(...args),
};
