import { Types } from "mongoose";

export interface IComment {
  id: number;
  username: string;
  profilePic: string;
  discordId: string;
  comment: string;
  likes?: { username: string; profilePic: string }[];
  replies?: Types.ObjectId[];
  isReply?: boolean;
}

export interface IPost {
  id: number;
  caption: string;
  postImage?: string;
  postImageKey?: string;
  author: { username: string; profilePic: string; id: string };
  likes?: { username: string; userId: string; profilePic: string }[];
  comments?: Types.ObjectId[];
}

export interface IUser {
  discordId: string;
  discordTag: string;
  username: string;
  avatar?: string;
  isAdmin?: boolean;
}

export interface IPhoto {
  url: string;
  key: string;
  name?: string;
  size?: number;
  uploadedAt?: Date;
}

export interface IGallery {
  season: string;
  cover?: string;
  photos: IPhoto[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ISupporter {
  name: string;
  tier: "bronze" | "silver" | "gold" | "diamond";
  discordId?: string;
  joinedAt?: Date;
  description?: string;
  profileUrl?: string;
  isActive?: boolean;
}

export interface IGuide {
  id?: string;
  header?: string;
  data?: any[];
  image?: string;
  imageKey?: string;
}
