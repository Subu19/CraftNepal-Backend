import mongoose, { Schema, Document } from "mongoose";
import { IGallery, IPhoto } from "../../dto/models";

export interface IGalleryModel extends IGallery, Document {}

const photoSchema = new Schema<IPhoto>({
  url: { type: String, required: true },
  key: { type: String, required: true },
  name: { type: String },
  size: { type: Number },
  uploadedAt: { type: Date, default: Date.now },
});

const gallerySchema = new Schema<IGalleryModel>({
  season: { type: String, required: true, unique: true },
  cover: { type: String },
  photos: [photoSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const Gallery = mongoose.model<IGalleryModel>("Gallery", gallerySchema);
