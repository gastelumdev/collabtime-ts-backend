import express, { Express, Request, Response } from 'express';
import http from "http";
import { Server } from "socket.io";
import dotenv from 'dotenv';
import cors from 'cors';
import bodyparser from 'body-parser';
import multer from 'multer';
import {v2 as cloudinary} from 'cloudinary';
import connection from './config/db';
import authRouter from "./routes/auth.routes";
import workspaceRouter from "./routes/workspace.routes";
import notificationRouter from "./routes/notifications.routes";
import dataCollectionRouter from './routes/dataCollection.routes';
import columnRouter from "./routes/column.routes";
import rowRouter from "./routes/row.routes";
import cellRouter from "./routes/cell.routes";
import uploadRouter from "./routes/upload.routes";
import path from 'path';
import verifyToken from './middleware/authJWT';
import fs from "fs";
import shell from "child_process";
import { v1 as uuidv1 } from 'uuid';
const sh = shell.execSync;
const uuid = uuidv1();

dotenv.config();

const app: Express = express();

const port = process.env.PORT;
const db_uri = process.env.MONGODB_URI;

connection(db_uri || "");

const corsOptions = {
  origin: process.env.CORS_URL
}

const persistedDiskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log("FILE", file)
    console.log(process.env.PERSISTED_ASSETS_DIR)
    cb(null, process.env.PERSISTED_ASSETS_DIR || "");
  },
  filename: (req, file, cb) => {
    const filename = file.originalname;
    const filenameSplit = filename.split(".");
    const ext = filenameSplit.pop();
    const noExtFilename = filenameSplit.join(".");
    cb(null, noExtFilename + "_" + uuid + "." + ext);
  }
});

export const persistedDocUpload = multer({storage: persistedDiskStorage});

const localDiskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log("FILE", file)
    console.log(process.env.ASSETS_DIR)
    cb(null, process.env.ASSETS_DIR || "");
  },
  filename: (req, file, cb) => {
    const filename = file.originalname;
    const filenameSplit = filename.split(".");
    const ext = filenameSplit.pop();
    const noExtFilename = filenameSplit.join(".");
    cb(null, noExtFilename + "_" + uuid + "." + ext);
  }
});

export const localDocUpload = multer({storage: localDiskStorage});

const storage = multer.memoryStorage();
export const notesUpload = multer({ storage: storage});

// const fileFilter = (req: any, file: any, cb: any) => {
//     if (file.mimetype === "image/jpg" || file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
//       cb(null, true)
//     } else {
//       cb(new Error("Image uploaded is not of type jpg/jpeg or png."), false);
//     }
// }

// export const dc = docUpload.single("docs");
// console.log(dc)

app.use(bodyparser.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static("uploads"));
app.use(cors(corsOptions));
// app.use(notesUpload.single("file"));
// app.use(docUpload.single("docs"));
// app.use(notesUpload.array("files"));

app.get('/', (req: Request, res: Response) => {
  res.send({title: 'Express + TypeScript Server!'})
});

export const uploadDoc = async (req: Request, res: Response) => {
  console.log("UPLOAD", req.file);
  try {
      // res.send({filename: req.file?.filename})
      if (req.file) {
          
          res.send({url: "success"});
      } else {
          res.send({url: undefined})
      }
  } catch (error) {
      console.log(error)
      res.status(400).send({success: false})
  }
}

export const uploadPersistedDoc = async (req: Request, res: Response) => {
  console.log("UPLOAD", req.file);
  try {
      // res.send({filename: req.file?.filename})
      if (req.file) {
          
          res.send({url: "success"});
      } else {
          res.send({url: undefined})
      }
  } catch (error) {
      console.log(error)
      res.status(400).send({success: false})
  }
}

uploadRouter.post("/uploadDocs", verifyToken, localDocUpload.single("docs"),uploadDoc);
uploadRouter.post("/uploadPersistedDocs", verifyToken, persistedDocUpload.single("docs"), uploadPersistedDoc);

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
  if (process.env.APP_ENVIRONMENT === "production") {
    const source = "/var/data/uploads/";
    const destination = "/opt/render/project/"
    sh(`mkdir -p ${destination}`);
    sh(`cp -r ${source} ${destination}`)
  }
})

// app.listen(port, () => {
//   console.log(`[server]: Server is running at http://localhost:${port}`);
// });