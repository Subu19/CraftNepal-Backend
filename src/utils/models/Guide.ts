import mongoose, { Schema, Document } from 'mongoose';

export interface IGuide extends Document {
    id: string; // The "name" of the guide used as custom ID
    header: string;
    data: any[]; // The report said "unstructured mixed data". Keeping as any[] or maybe explicitly mixed.
    image?: string;
}

const guideSchema: Schema = new Schema({
    id: String,
    header: String,
    data: Array,
    image: String,
});

export default mongoose.model<IGuide>("Guide", guideSchema);
