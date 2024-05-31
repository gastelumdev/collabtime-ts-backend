import { Server } from "socket.io";
import app from "./app";

export const io = new Server(app, { cors: { origin: process.env.CORS_URL } })

io.on("connection", (socket) => {
    socket.emit("con", { message: "a new client connected" })
    console.log("Socket.io running")
})

export default io;