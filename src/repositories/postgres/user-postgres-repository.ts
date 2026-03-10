import pool from "../../db/postgres";
import { usersDBType, UserRow, DbId } from "../types";
import { IUserRepository } from "../interfaces/IUserRepository";

export const userRepository: IUserRepository = {
  async createUser(newUser: usersDBType<DbId>): Promise<usersDBType<DbId>> {
    await pool.query(
      `INSERT INTO users
        (user_name, email, password_hash, password_salt, created_at, avatar_url, confirmation_code, expiration_date, is_confirmed,role)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        newUser.userName,
        newUser.email,
        newUser.passwordHash,
        newUser.passwordSalt,
        newUser.createdAt,
        newUser.avatarUrl,
        newUser.emailConfirmation.confirmationCode,
        newUser.emailConfirmation.expirationDate,
        newUser.emailConfirmation.isConfirmed,
        newUser.role,
      ],
    );
    return newUser;
  },

  async findUserById(id: DbId): Promise<usersDBType<DbId> | null> {
    const result = await pool.query(`SELECT * FROM users WHERE id = $1`, [id]);
    if (result.rows.length === 0) return null;
    return mapToUser(result.rows[0]);
  },

  async findByLoginOrEmail(
    loginOrEmail: string,
  ): Promise<usersDBType<DbId> | null> {
    const result = await pool.query(
      `SELECT * FROM users WHERE user_name = $1 OR email = $1`,
      [loginOrEmail],
    );
    if (result.rows.length === 0) return null;
    return mapToUser(result.rows[0]);
  },

  async getAllUsers(
    page: number,
    limit: number,
    search?: string,
  ): Promise<usersDBType<DbId>[]> {
    const skip = (page - 1) * limit;
    if (search) {
      const result = await pool.query(
        `SELECT * FROM users WHERE user_name ILIKE $1 OR email ILIKE $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
        [`%${search}%`, limit, skip],
      );
      return result.rows.map(mapToUser);
    }
    const result = await pool.query(
      `SELECT * FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [limit, skip],
    );
    return result.rows.map(mapToUser);
  },

  async getUserCount(search?: string): Promise<number> {
    if (search) {
      const result = await pool.query(
        `SELECT COUNT(*) FROM users WHERE user_name ILIKE $1 OR email ILIKE $1`,
        [`%${search}%`],
      );
      return parseInt(result.rows[0].count, 10);
    }
    const result = await pool.query(`SELECT COUNT(*) FROM users`);
    return parseInt(result.rows[0].count, 10);
  },

  async updateConfirmation(userId: DbId): Promise<boolean> {
    const result = await pool.query(
      `UPDATE users SET is_confirmed = true WHERE id = $1`,
      [userId],
    );
    return result.rowCount === 1;
  },
  async updatePassword(
    userId: DbId,
    newPasswordHash: string,
  ): Promise<boolean> {
    const result = await pool.query(
      `UPDATE users SET password_hash = $1 WHERE id = $2`,
      [newPasswordHash, userId],
    );
    return result.rowCount === 1;
  },

  async deleteByEmail(email: string): Promise<boolean> {
    const result = await pool.query(`DELETE FROM users WHERE email = $1`, [
      email,
    ]);
    return result.rowCount === 1;
  },
};

const mapToUser = (row: UserRow): usersDBType<DbId> => ({
  _id: row.id,
  userName: row.user_name,
  email: row.email,
  role: row.role,
  passwordHash: row.password_hash,
  passwordSalt: row.password_salt,
  createdAt: row.created_at,
  avatarUrl: row.avatar_url,
  emailConfirmation: {
    confirmationCode: row.confirmation_code,
    expirationDate: row.expiration_date,
    isConfirmed: row.is_confirmed,
  },
});
