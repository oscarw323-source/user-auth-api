import { feedbackCollection } from "../../db/mongo";
import { FeedbackDBType } from "../types";

export const feedbackRepository = {
  async createFeedback(feedback: FeedbackDBType): Promise<FeedbackDBType> {
    await feedbackCollection.insertOne(feedback);
    return feedback;
  },

  async getAllFeedbacks(): Promise<FeedbackDBType[]> {
    return feedbackCollection.find().sort({ createdAt: -1 }).toArray();
  },
};
