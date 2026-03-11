import Nodemailer from "nodemailer";
import { MailtrapTransport } from "mailtrap";
import dotenv from "dotenv";
import { logger } from "../logger";
dotenv.config();

export const emailAdapter = {
  async sendEmail(email: string, subject: string, message: string) {
    const transport = Nodemailer.createTransport(
      MailtrapTransport({
        token: process.env.MAILTRAP_TOKEN!,
      }),
    );
    const sender = {
      address: "hello@demomailtrap.co",
      name: "Tarasik Manager",
    };
    const info = await transport.sendMail({
      from: sender,
      to: email,
      subject: subject,
      html: message,
      category: "Test Email",
    });
    logger.info({ info }, "Email sent");
    return info;
  },
};
