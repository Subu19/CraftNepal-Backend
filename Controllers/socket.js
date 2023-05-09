const Post = require("../utils/models/Post");

exports = module.exports = function (io) {
  console.log("test");
  io.on("connection", (socket) => {
    console.log("new client");
    socket.on("updatePost", async (data) => {
      const post = await Post.findById(data.postId);

      io.emit("updatePost:" + data.postId, {
        post: post,
      });
    });

    socket.on("updateComments", async (data) => {
      const post = await (
        await Post.findOne({ _id: data.postId })
      ).populate({ path: "comments" });

      io.emit("updateComments:" + data.postId, {
        post: post,
      });
      io.emit("updatePost:" + data.postId, {
        post: post,
      });
    });

    socket.on("disconnected", () => {
      console.log("client left");
    });
  });
};
