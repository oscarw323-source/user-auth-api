export const settings = {
  MONGO_URI: process.env.MONGO_URI || "mongodb://localhost:27017",
  JWT_SECRET: process.env.JWT_SECRET || "123",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "refresh-secret-123",
  SUPER_ADMIN_TOTP_SECRET: process.env.SUPER_ADMIN_TOTP_SECRET || "",
};
