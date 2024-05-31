import { Server } from "socket.io";
import app from "./app";

export const io = new Server(app, { cors: { origin: process.env.CORS_URL } })

export const ioConnection = () => {

    io.on("connection", (socket: any) => {
        console.log("IO RUNNING")
        socket.emit("con", { message: "a new client connected" });
        console.log("Socket.io running")
    })

    return io;
}