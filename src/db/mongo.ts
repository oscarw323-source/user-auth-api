import { MongoClient } from "mongodb";
import {
  usersDBType,
  FeedbackDBType,
  MessageDBType,
} from "../repositories/types";
import { logger } from "../logger";

let client: MongoClient | null = null;

const getClient = () => {
  if (!client) {
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017";
    client = new MongoClient(mongoUri);
  }
  return client;
};

export const db = new Proxy({} as ReturnType<MongoClient["db"]>, {
  get(_target, prop) {
    return (getClient().db("usersDB") as any)[prop];
  },
});

export const usersCollection = new Proxy(
  {} as ReturnType<typeof db.collection<usersDBType>>,
  {
    get(_target, prop) {
      return (
        getClient().db("usersDB").collection<usersDBType>("users") as any
      )[prop];
    },
  },
);

export const feedbackCollection = new Proxy(
  {} as ReturnType<typeof db.collection<FeedbackDBType>>,
  {
    get(_target, prop) {
      return (
        getClient().db("usersDB").collection<FeedbackDBType>("feedbacks") as any
      )[prop];
    },
  },
);

export const messageCollection = new Proxy(
  {} as ReturnType<typeof db.collection<MessageDBType>>,
  {
    get(_target, prop) {
      return (
        getClient().db("usersDB").collection<MessageDBType>("message") as any
      )[prop];
    },
  },
);

export const runDb = async () => {
  try {
    await getClient().connect();
    await getClient().db("usersDB").command({ ping: 1 });
    logger.info("✅ Connected to MongoDB");
  } catch (error) {
    logger.error({ error }, "❌ MongoDB connection failed");
  }
};
