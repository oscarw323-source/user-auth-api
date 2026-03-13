import { Pool } from "pg";
import { logger } from "../logger";

let pool: Pool;

const getPool = (): Pool => {
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

export default new Proxy({} as Pool, {
  get(_target, prop) {
    return (getPool() as any)[prop];
  },
});
