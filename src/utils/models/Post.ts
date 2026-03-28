import mongoose, { Schema, Document, Types } from 'mongoose';
import { IComment } from './Comment';

export interface IPost extends Document {
    id: number;
    caption: string;
    postImage?: string;
    author: {
        username: string;
        profilePic: string;
        id: string;
    };
    likes: {
        username: string;
        userId: string;
        profilePic: string;
    }[];
    comments: (Types.ObjectId | IComment)[];
}

const postSchema: Schema = new Schema({
    id: Number,
    caption: String,
    postImage: String,
    author: { username: String, profilePic: String, id: String },
    likes: [{ username: String, userId: String, profilePic: String }],
    comments: [{ type: mongoose.Types.ObjectId, ref: "Comment" }],
});

export default mongoose.model<IPost>("Post", postSchema);
