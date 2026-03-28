import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    discordId: string;
    discordTag: string;
    username: string;
    avatar: string;
    isAdmin?: boolean;
}

const UserSchema: Schema = new Schema({
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

export default mongoose.model<IUser>('User', UserSchema);
