import QRCode from "qrcode";
import { settings } from "../seting/settings";
const otplib = require("otplib");

export const totpService = {
  generateSecret(): string {
    return otplib.generateSecret();
  },

  async generateQRCode(login: string, secret: string): Promise<string> {
    const otpauth = `otpauth://totp/user-auth-api:${login}?secret=${secret}&issuer=user-auth-api`;
    return QRCode.toDataURL(otpauth);
  },

  verifyCode(code: string, secret: string): boolean {
    try {
      return otplib.verify({ token: code, secret });
    } catch (e) {
      console.error("TOTP verify error:", e);
      return false;
    }
  },

  getSecret(): string {
    return settings.SUPER_ADMIN_TOTP_SECRET;
  },
};
