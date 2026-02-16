import { emailAdapter } from "../adapters/email-adapter";
import { usersDBType } from "../repositories/types";

export const emailManager = {
  async sendPasswordRecoveryMessage(user: any) {
    await emailAdapter.sendEmail(
      user.email,
      "Password Recovery",
      `<div>Your recovery code: ${user.recoveryCode}</div>`,
    );
  },

  async sendEmailConfirmationMessage(user: usersDBType) {
    await emailAdapter.sendEmail(
      user.email,
      "Email Confirmation",
      `<h1>Confirm your email</h1>
       <p>Click the link: 
       <a href="http://localhost:3000/auth/confirm?code=${user.emailConfirmation.confirmationCode}&email=${user.email}">
       Confirm Email
       </a></p>`,
    );
  },
};
