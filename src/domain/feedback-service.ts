import { feedbackRepository } from "../repositories/feedback-repository";
import { ObjectId } from "mongodb";
import { FeedbackDBType } from "../repositories/types";

export const feedbackService = {
  async sendFeedback(
    comment: string,
    userId: ObjectId,
  ): Promise<FeedbackDBType> {
    const newFeedback: FeedbackDBType = {
      _id: new ObjectId(),
      comment,
      userId,
      createdAt: new Date(),
    };

    return feedbackRepository.createFeedback(newFeedback);
  },

  async getAllFeedbacks(): Promise<FeedbackDBType[]> {
    return feedbackRepository.getAllFeedbacks();
  },
};
