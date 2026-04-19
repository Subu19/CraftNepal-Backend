import mongoose, { Schema, Document } from "mongoose";
import { IGuide } from "../../dto/models";

export interface IGuideModel extends Omit<IGuide, "id">, Document {
  id: string;
}

const guideSchema = new Schema<IGuideModel>({
  id: { type: String },
  header: { type: String },
  data: { type: [Schema.Types.Mixed] },
  image: { type: String },
  imageKey: { type: String },
});

export const Guide = mongoose.model<IGuideModel>("Guide", guideSchema);
