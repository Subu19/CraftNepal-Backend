import { Server, Socket } from "socket.io";
import { Post } from "../utils/models/Post";

export default function (io: Server) {
  io.on("connection", (socket: Socket) => {
    socket.on("updatePost", async (data: any) => {
      try {
        const results = await Post.find({}).sort({ _id: -1 }).limit(10).populate("comments");
        io.emit("updatedPost", results);
      } catch (err) {
        console.error(err);
      }
    });
    
    socket.on("updateComments", async (data: any) => {
      try {
        const post = await Post.findById(data.postId).populate("comments");
        if (post) {
            io.emit("updatedComments", post.comments);
        }
      } catch (err) {
        console.error(err);
      }
    });

    socket.on("disconnect", () => {
    });
  });
}
