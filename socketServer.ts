import { Server } from "socket.io";
import app from "./app";

export const io = new Server(app, { cors: { origin: process.env.CORS_URL } })

export const ioConnection = () => {

    io.on("connection", (socket: any) => {
        socket.emit("con", { message: "a new client connected" });
    })

    return io;
}