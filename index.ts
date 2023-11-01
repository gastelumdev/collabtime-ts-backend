import express, { Express, Request, Response } from 'express';
import http from "http";
import { Server } from "socket.io";
import dotenv from 'dotenv';
import cors from 'cors';
import bodyparser from 'body-parser';
import connection from './config/db';
import authRouter from "./routes/auth.routes"
import workspaceRouter from "./routes/workspace.routes"

dotenv.config();

const app: Express = express();

const port = process.env.PORT;
const db_uri = process.env.MONGODB_URI;

connection(db_uri || "")

const corsOptions = {
  origin: process.env.CORS_URL
}

app.use(bodyparser.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors(corsOptions));



app.get('/', (req: Request, res: Response) => {
  res.send({title: 'Express + TypeScript Server!'});
});

app.use(authRouter);
app.use(workspaceRouter);


const server = http.createServer();

export const io = new Server(server, {cors: {origin: process.env.CORS_URL}})

io.on("connection", (socket) => {
  socket.emit("con", {message: "a new client connected"})
  console.log("Socket.io running")
  
})

server.listen(9000, () => {
  console.log("[ws-server]: Server is running on port 9000")
})

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});