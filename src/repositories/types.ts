import { ObjectId } from "mongodb";

export type usersDBType = {
  _id: ObjectId;
  userName: string;
  email: string;
  passwordHash: string;
  passwordSalt: string;
  createdAt: Date;
  avatarUrl: string;
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

export type MessageDBType = {
  _id: ObjectId;
  userId: ObjectId;
  userName: string;
  avatarUrl: string;
  message: string;
  createdAt: Date;
  fileUrl?: string;
  fileType?: "image" | "video" | "audio" | "raw";
  fileName?: string;
};
export type DirectMessageDBType = {
  _id: ObjectId;
  fromUserId: ObjectId;
  fromUserName: string;
  fromAvatarUrl: string;
  toUserId: ObjectId;
  toUserName: string;
  message: string;
  createdAt: Date;
  fileUrl?: string;
  fileType?: "image" | "video" | "audio" | "raw";
  fileName?: string;
  chatId: string;
  isRead: boolean;
};
