import { MongoClient } from "mongodb";
import {
  usersDBType,
  FeedbackDBType,
  MessageDBType,
} from "../repositories/types";
import { logger } from "../logger";

const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017";

export const client = new MongoClient(mongoUri);
export const db = client.db("usersDB");
export const usersCollection = db.collection<usersDBType>("users");
export const feedbackCollection = db.collection<FeedbackDBType>("feedbacks");
export const messageCollection = db.collection<MessageDBType>("message");

export const runDb = async () => {
  try {
    await client.connect();
    await db.command({ ping: 1 });
    logger.info("✅ Connected to MongoDB");
  } catch (error) {
    logger.error({ error }, "❌ MongoDB connection failed");
    await client.close();
  }
};
