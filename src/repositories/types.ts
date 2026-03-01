import { ObjectId } from "mongodb";

export type usersDBType<Tid = ObjectId> = {
  _id: Tid;
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

export type UserRow = {
  id: number;
  user_name: string;
  email: string;
  password_hash: string;
  password_salt: string;
  created_at: Date;
  avatar_url: string;
  confirmation_code: string;
  expiration_date: Date;
  is_confirmed: boolean;
};

export type DbId = ObjectId | number;

export type JwtPayload = {
  userId: string;
};

export type RecoveryEmailType = {
  email: string;
  recoveryCode: string;
};
