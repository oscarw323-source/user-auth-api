import { MongoClient } from "mongodb";
import { usersDBType, FeedbackDBType } from "../repositories/types";

const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017";

export const client = new MongoClient(mongoUri);
const db = client.db("usersDB");

export const usersCollection = db.collection<usersDBType>("users");
export const feedbackCollection = db.collection<FeedbackDBType>("feedbacks");

export const runDb = async () => {
  try {
    await client.connect();
    await db.command({ ping: 1 });
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    await client.close();
  }
};
