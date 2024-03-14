import express, { Express, Request, Response } from 'express';
import http from "http";
import { Server } from "socket.io";
import dotenv from 'dotenv';
import cors from 'cors';
import bodyparser from 'body-parser';
import multer from 'multer';
import cron from "node-cron";
import { v2 as cloudinary } from 'cloudinary';
import connection from './config/db';
import * as uploadController from "./controllers/upload.controller"
import authRouter from "./routes/auth.routes";
import workspaceRouter from "./routes/workspace.routes";
import notificationRouter from "./routes/notifications.routes";
import dataCollectionRouter from './routes/dataCollection.routes';
import columnRouter from "./routes/column.routes";
import rowRouter from "./routes/row.routes";
import cellRouter from "./routes/cell.routes";
import uploadRouter from "./routes/upload.routes";
import documentRouter from "./routes/document.routes";
import searchRouter from "./routes/search.routes";
import tagRouter from "./routes/tag.routes";
import messageRouter from "./routes/message.routes";
import path from 'path';
import verifyToken from './middleware/authJWT';
import fs from "fs";
import shell from "child_process";
import { v1 as uuidv1 } from 'uuid';
import sendEmail from './utils/sendEmail';
import DataCollection from './models/dataCollection.model';
import Row from './models/row.models';
import User from './models/auth.model';
import Workspace from './models/workspace.model';
import Cell from './models/cell.models';
import setReminders from './utils/setReminders';
import Column from './models/column.model';
import { addValues, convertRowCells, fullfillMissingRows } from './utils/helpers';
import Notification from './models/notification.model';

// fullfillMissingRows();

// const __dirname = path.resolve();
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

export const persistedDocUpload = multer({ storage: persistedDiskStorage });

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

export const localDocUpload = multer({ storage: localDiskStorage });

const storage = multer.memoryStorage();
export const notesUpload = multer({ storage: storage });

const setCrititcalReminders = async () => {

  const rows = await Row.find({ acknowledged: false, reminder: true });
  console.log("ROWS", rows)

  for (const row of rows) {
    const dataCollection = await DataCollection.findOne({ _id: row.dataCollection })
    const workspace = await Workspace.findOne({ _id: dataCollection?.workspace })
    const columns = await Column.find({ dataCollection: dataCollection?._id })
    const cells = await Cell.find({ row: row._id });
    const user = await User.findOne({ _id: row.createdBy });

    for (const column of columns) {
      if (column.type === "priority" && row.values[column.name] === "Critical") {
        console.log(row)
        const task = {
          message: `A critical assingment in ${workspace?.name} - ${dataCollection?.name} has not been acknowledged.`,
          dataCollectionName: dataCollection?.name,
          url: `${process.env.CLIENT_URL || "http://localhost:5173"}/workspaces/${workspace?._id}/dataCollections/${dataCollection?._id}`
        };

        sendEmail({
          email: user?.email || "",
          subject: `Collabtime - A critical assignment has not been acknowledged.`,
          payload: task,
          template: "./template/genericMessage.handlebars",
        }, (res: Response) => console.log("Email sent."))
      }
    }
  }
}

const updateRowAcknowledgements = async () => {
  const rows = await Row.find({});

  for (const row of rows) {
    const rowQuery: any = await Row.findOne({ _id: row._id });

    rowQuery.acknowledged = false;

    rowQuery.save();
    console.log("Row updated");
  }
}

const updateCompleted = async () => {
  const dataCollections = await DataCollection.find({});

  for (const dataCollection of dataCollections) {
    const rows = await Row.find({ dataCollection: dataCollection._id });

    for (const row of rows) {
      if (!row.complete) {
        if (row.values["status"] !== undefined && row.values["status"] === "Done") {
          row.complete = true;
        }
      }

      const newRow: any = await Row.findByIdAndUpdate(row._id, { $set: { complete: row.complete } }, { new: true });
      console.log(newRow.complete);
    }
  }
}

const resetHiddenRows = async () => {
  const dataCollections = await DataCollection.find({});

  for (const dataCollection of dataCollections) {
    const rows = await Row.find({ dataCollection: dataCollection._id });

    for (const row of rows) {
      if (!row.isVisible) {
        row.isVisible = true;

        const newRow = await Row.findByIdAndUpdate(row._id, row, { new: true });
        console.log(newRow);
      }

    }
  }

}

// resetHiddenRows()

// updateCompleted()

// updateRowAcknowledgements();

// setCrititcalReminders()

// JOB SCHEDULES *********************************************************

const deleteOldNotifications = async () => {
  let today = new Date();
  let priorDate = new Date(new Date().setDate(today.getDate() - 30));
  console.log(priorDate.toISOString().split("T")[0])
  await Notification.deleteMany({ "createdAt": { $lt: priorDate.toISOString().split("T")[0] } });
}

if (process.env.APP_ENVIRONMENT === "production") {

  cron.schedule("0 0 7 * * 1,2,3,4,5", () => {
    setReminders()
  });

  cron.schedule("0 0 15 * * 1,2,3,4,5", () => {
    setReminders()
  })

  cron.schedule("0 0,15,30,45 * * * *", () => {
    setCrititcalReminders()
  })

  cron.schedule("0 0 0 * * *", () => {
    deleteOldNotifications()
  })
}

const updateUsers = async () => {
  const users = await User.find({ _id: "65c63f6b1a15510bc55bb432" });

  for (const user of users) {
    console.log(user)
    let newUser = await User.findByIdAndUpdate(user._id, { ...user, logoURL: "https://collabtime-ts-backend.onrender.com/docs/MVP%20Original%20Logo_551aecd0-c608-11ee-b41a-e97b0c5f0d41.png" }, { new: true })
    console.log(newUser)
  }
}

const changeAllRows = async () => {
  const dataCollections = await DataCollection.find({ _id: "65c3c566290dd890c63ef4c9" });

  for (const dataCollection of dataCollections) {
    const rows = await Row.find({ dataCollection: dataCollection._id });

    for (const row of rows) {
      const r: any = await Row.findById(row._id);
      r.isParent = false;
      r.parentRowId = null;
      r.isVisible = true;
      r.showSubrows = true;
      r.save();
      console.log(r.isParent, r.parentRowId, r.position)
    }
  }
}

// changeAllRows()
// convertRowCells()

// updateUsers()

// addValues()

app.use(bodyparser.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static("uploads"));
app.use(cors(corsOptions));

app.get('/', (req: Request, res: Response) => {
  res.send({ title: 'Express + TypeScript Server!' })
});

// uploadRouter.post("/upload", verifyToken, notesUpload.single("file"), uploadController.upload);
uploadRouter.post("/uploadDocs", verifyToken, localDocUpload.array("docs", 50), uploadController.uploadDoc);
uploadRouter.post("/uploadPersistedDocs", verifyToken, persistedDocUpload.array("docs", 50), uploadController.uploadPersistedDoc);

app.use(authRouter);
app.use(workspaceRouter);
app.use(notificationRouter);
app.use(dataCollectionRouter);
app.use(columnRouter);
app.use(rowRouter);
app.use(cellRouter);
app.use(uploadRouter);
app.use(documentRouter);
app.use(searchRouter);
app.use(tagRouter);
app.use(messageRouter);


const server = http.createServer(app);

export const io = new Server(server, { cors: { origin: process.env.CORS_URL } })

io.on("connection", (socket) => {
  socket.emit("con", { message: "a new client connected" })
  console.log("Socket.io running")

})



server.listen(port, () => {
  console.log("[ws-server]: Server is running on port " + port)
  if (process.env.APP_ENVIRONMENT === "production") {
    const source = "/var/data/uploads/";
    const destination = "/opt/render/project/src/"
    sh(`mkdir -p ${destination}`);
    sh(`cp -r ${source} ${destination}`)
  }
})

// app.listen(port, () => {
//   console.log(`[server]: Server is running at http://localhost:${port}`);
// });