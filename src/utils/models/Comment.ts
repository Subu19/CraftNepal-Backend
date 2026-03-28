import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IComment extends Document {
    id: number;
    username: string;
    profilePic: string;
    discordId: string;
    comment: string;
    likes: { username: string; profilePic: string }[];
    replies: Types.ObjectId[] | IComment[]; // Can be populated
    isReply: boolean;
}

const commentSchema: Schema = new Schema({
    id: Number,
    username: String,
    profilePic: String,
    discordId: String,
    comment: String,
    likes: [{ username: String, profilePic: String }],
    replies: [{ type: mongoose.Types.ObjectId, ref: "Comment" }],
    isReply: Boolean,
});

export default mongoose.model<IComment>("Comment", commentSchema);
