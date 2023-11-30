import express, { Express, Request, Response } from 'express';
import http from "http";
import { Server } from "socket.io";
import dotenv from 'dotenv';
import cors from 'cors';
import bodyparser from 'body-parser';
import multer from 'multer';
import connection from './config/db';
import authRouter from "./routes/auth.routes"
import workspaceRouter from "./routes/workspace.routes"
import notificationRouter from "./routes/notifications.routes"
import dataCollectionRouter from './routes/dataCollection.routes';
import columnRouter from "./routes/column.routes";
import rowRouter from "./routes/row.routes";
import cellRouter from "./routes/cell.routes";
import uploadRouter from "./routes/upload.routes"
import path from 'path';

dotenv.config();

const app: Express = express();

const port = process.env.PORT;
const db_uri = process.env.MONGODB_URI;

connection(db_uri || "")

const corsOptions = {
  origin: process.env.CORS_URL
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/images")
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + "_" + Date.now() + path.extname(file.originalname))
  }
})

export const notesUpload = multer({ storage: storage});

app.use(bodyparser.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static("uploads"))
app.use(cors(corsOptions));
app.use(notesUpload.single("file"));
// app.use(notesUpload.array("files"));

app.get('/', (req: Request, res: Response) => {
  res.send({title: 'Express + TypeScript Server!'})
});

app.use(authRouter);
app.use(workspaceRouter);
app.use(notificationRouter);
app.use(dataCollectionRouter);
app.use(columnRouter);
app.use(rowRouter);
app.use(cellRouter);
app.use(uploadRouter);


const server = http.createServer(app);

export const io = new Server(server, {cors: {origin: process.env.CORS_URL}})

io.on("connection", (socket) => {
  socket.emit("con", {message: "a new client connected"})
  console.log("Socket.io running")
  
})

server.listen(port, () => {
  console.log("[ws-server]: Server is running on port " + port)
})

// app.listen(port, () => {
//   console.log(`[server]: Server is running at http://localhost:${port}`);
// });