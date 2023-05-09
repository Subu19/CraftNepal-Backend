const mongoose = require("mongoose");

var commentSchema = new mongoose.Schema({
  id: Number,
  username: String,
  profilePic: String,
  discordId: String,
  comment: String,
  likes: [{ username: String, profilePic: String }],
  replies: [{ type: mongoose.Types.ObjectId, ref: "Comment" }],
  isReply: Boolean,
});

module.exports = mongoose.model("Comment", commentSchema);
