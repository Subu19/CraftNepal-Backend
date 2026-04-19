import mongoose, { Schema, Document } from "mongoose";
import { IUser } from "../../dto/models";

export interface IUserModel extends IUser, Document {}

const UserSchema = new Schema<IUserModel>({
  discordId: {
    type: String,
    required: true,
    unique: true,
  },
  discordTag: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  avatar: {
    type: String,
  },
  isAdmin: {
    type: Boolean,
  },
});

export const User = mongoose.model<IUserModel>("User", UserSchema);
