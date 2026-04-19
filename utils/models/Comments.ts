import mongoose, { Schema, Document } from "mongoose";
import { IComment } from "../../dto/models";

export interface ICommentModel extends Omit<IComment, "id">, Document {
  id: number;
}

const commentSchema = new Schema<ICommentModel>({
  id: { type: Number },
  username: { type: String },
  profilePic: { type: String },
  discordId: { type: String },
  comment: { type: String },
  likes: [{ username: { type: String }, profilePic: { type: String } }],
  replies: [{ type: Schema.Types.ObjectId, ref: "Comment" }],
  isReply: { type: Boolean },
});

export const Comment = mongoose.model<ICommentModel>("Comment", commentSchema);
