import { emailAdapter } from "../adapters/email-adapter";
import { emailManager } from "../managers/email-manager";
import { RecoveryEmailType } from "../repositories/types";

export const businessService = {
  async doOperation(user: RecoveryEmailType) {
    await emailManager.sendPasswordRecoveryMessage(user);
  },
  async doOperation2(email: string) {
    await emailAdapter.sendEmail(
      email,
      "password recovery",
      "<div>message</div>",
    );
  },
};
