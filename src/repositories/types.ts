import { ObjectId } from "mongodb";

export type usersDBType = {
  _id: ObjectId;
  userName: string;
  email: string;
  passwordHash: string;
  passwordSalt: string;
  createdAt: Date;
  emailConfirmation: {
    confirmationCode: string;
    expirationDate: Date;
    isConfirmed: boolean;
  };
};
export type FeedbackDBType = {
  _id: ObjectId;
  comment: string;
  userId: ObjectId;
  createdAt: Date;
};
