import mongoose, { Schema, Document } from "mongoose";
import { ISupporter } from "../../dto/models";

export interface ISupporterModel extends ISupporter, Document {}

const SupporterSchema = new Schema<ISupporterModel>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    tier: {
      type: String,
      enum: ["bronze", "silver", "gold", "diamond"],
      default: "bronze",
    },
    discordId: {
      type: String,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    description: {
      type: String,
      maxlength: 500,
    },
    profileUrl: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const Supporter = mongoose.model<ISupporterModel>("Supporter", SupporterSchema);
