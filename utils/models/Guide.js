const mongoose = require("mongoose");

var guideSchema = new mongoose.Schema({
  id: String,
  header: String,
  data: Array,
  image: String,
});

module.exports = mongoose.model("Guide", guideSchema);
