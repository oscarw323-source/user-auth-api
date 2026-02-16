import { emailAdapter } from "../adapters/email-adapter";
import { emailManager } from "../managers/email-manager";

export const businessService = {
  async doOperation(user: any) {
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
