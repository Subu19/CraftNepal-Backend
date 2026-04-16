const mongoose = require("mongoose");

var guideSchema = new mongoose.Schema({
  id: String,
  header: String,
  data: Array,
  image: String,
  imageKey: String, // Store S3 key separately for easy URL generation
});

module.exports = mongoose.model("Guide", guideSchema);
