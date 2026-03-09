import pool from "../db/postgres";

export const refreshTokenRepository = {
  async saveToken(userId: string, token: string) {
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      await pool.query(
        `INSERT INTO refresh_tokens (user_id, token, expires_at) 
                VALUES ($1, $2, $3)`,
        [userId, token, expiresAt],
      );
    } catch {}
  },

  async findToken(token: string): Promise<boolean> {
    try {
      const result = await pool.query(
        `SELECT id FROM refresh_tokens 
            WHERE token = $1 AND expires_at > NOW()`,
        [token],
      );
      return result.rows.length > 0;
    } catch {
      return false;
    }
  },

  async deleteToken(token: string) {
    try {
      await pool.query(`DELETE FROM refresh_tokens WHERE token = $1`, [token]);
    } catch {}
  },

  async deleteAllUserTokens(userId: string) {
    try {
      await pool.query(`DELETE FROM refresh_tokens WHERE user_id = $1`, [
        userId,
      ]);
    } catch {}
  },
};
