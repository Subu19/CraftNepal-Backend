const mongoose = require("mongoose");

const photoSchema = new mongoose.Schema({
  url: { type: String, required: true },
  key: { type: String, required: true },
  name: String,
  size: Number,
  uploadedAt: { type: Date, default: Date.now },
});

const gallerySchema = new mongoose.Schema({
  season: { type: String, required: true, unique: true },
  cover: String,
  photos: [photoSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Gallery", gallerySchema);
