import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import { logger } from "../logger";

const client = new SecretsManagerClient({ region: "eu-north-1" });

export const loadSecrets = async () => {
  try {
    const command = new GetSecretValueCommand({
      SecretId: "user-auth-api/production",
    });
    const response = await client.send(command);
    const secrets = JSON.parse(response.SecretString!);

    process.env.JWT_SECRET = secrets.JWT_SECRET;
    process.env.JWT_REFRESH_SECRET = secrets.JWT_REFRESH_SECRET;
    process.env.POSTGRES_URI = secrets.POSTGRES_URI;
    process.env.DB_TYPE = secrets.DB_TYPE;
    process.env.SUPER_ADMIN_LOGIN = secrets.SUPER_ADMIN_LOGIN;
    process.env.SUPER_ADMIN_EMAIL = secrets.SUPER_ADMIN_EMAIL;
    process.env.SUPER_ADMIN_PASSWORD = secrets.SUPER_ADMIN_PASSWORD;
    process.env.SUPER_ADMIN_TOTP_SECRET = secrets.SUPER_ADMIN_TOTP_SECRET;
    process.env.SWAGGER_USER = secrets.SWAGGER_USER;
    process.env.SWAGGER_PASS = secrets.SWAGGER_PASS;
    process.env.MONGO_URI = secrets.MONGO_URI;
    process.env.CLOUDINARY_CLOUD_NAME = secrets.CLOUDINARY_CLOUD_NAME;
    process.env.CLOUDINARY_API_KEY = secrets.CLOUDINARY_API_KEY;
    process.env.CLOUDINARY_API_SECRET = secrets.CLOUDINARY_API_SECRET;
    process.env.MAILTRAP_TOKEN = secrets.MAILTRAP_TOKEN;

    logger.info("✅ Secrets loaded from AWS Secrets Manager");
  } catch (err) {
    logger.error({ err }, "❌ Failed to load secrets from AWS Secrets Manager");
    throw err;
  }
};
