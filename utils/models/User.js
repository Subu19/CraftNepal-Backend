const mongoose = require("mongoose");
const UserSchema = new mongoose.Schema({
  discordId: {
    type: String,
    required: true,
    unique: true,
  },
  discordTag: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  avatar: {
    type: String,
    required: true,
  },
  isAdmin: {
    type: Boolean,
  },
});

module.exports = mongoose.model("User", UserSchema);
