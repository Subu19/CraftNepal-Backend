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
  icon: { type: String },
  iconKey: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  deletedAt: { type: Date, default: null },
});

export const Guide = mongoose.model<IGuideModel>("Guide", guideSchema);
