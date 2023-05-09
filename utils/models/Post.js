const mongoose = require("mongoose");

var postSchema = new mongoose.Schema({
  id: Number,
  caption: String,
  postImage: String,
  author: { username: String, profilePic: String, id: String },
  likes: [{ username: String, userId: String, profilePic: String }],
  comments: [{ type: mongoose.Types.ObjectId, ref: "Comment" }],
});

module.exports = mongoose.model("Post", postSchema);
