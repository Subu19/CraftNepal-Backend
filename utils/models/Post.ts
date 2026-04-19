import mongoose, { Schema, Document } from "mongoose";
import { IPost } from "../../dto/models";

export interface IPostModel extends Omit<IPost, "id">, Document {
  id: number;
}

const postSchema = new Schema<IPostModel>({
  id: { type: Number },
  caption: { type: String },
  postImage: { type: String },
  postImageKey: { type: String },
  author: {
    username: { type: String },
    profilePic: { type: String },
    id: { type: String },
  },
  likes: [
    {
      username: { type: String },
      userId: { type: String },
      profilePic: { type: String },
    },
  ],
  comments: [{ type: Schema.Types.ObjectId, ref: "Comment" }],
});

export const Post = mongoose.model<IPostModel>("Post", postSchema);
