import { Pool } from "pg";

const pool = new Pool({
  connectionString:
    process.env.POSTGRES_URI || "postgresql://localhost:5432/usersDB",
});
export const runPostgres = async () => {
  try {
    await pool.query("SELECT 1");
    console.log("✅ Connected to PostgreSQL");
  } catch (error) {
    console.error("❌ PostgreSQL connection failed:", error);
  }
};

export default pool;
