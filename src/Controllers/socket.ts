import { Server, Socket } from 'socket.io';

export default (io: Server) => {
    io.on("connection", (socket: Socket) => {
        console.log("User connected");
        socket.on("disconnect", () => {
            console.log("User disconnected");
        });
        socket.on("chat", (msg: string) => {
            console.log("message: " + msg);
            io.emit("chat", msg);
        });
    });
};
