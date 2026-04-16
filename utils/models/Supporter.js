const mongoose = require("mongoose");

const SupporterSchema = new mongoose.Schema(
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

module.exports = mongoose.model("Supporter", SupporterSchema);
