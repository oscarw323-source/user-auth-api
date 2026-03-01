import { FeedbackDBType } from "../types";

export interface IFeedbackRepository {
  createFeedback(feedback: FeedbackDBType): Promise<FeedbackDBType>;
  getAllFeedbacks(): Promise<FeedbackDBType[]>;
}
