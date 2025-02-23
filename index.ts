import express, { Express, Request, Response } from 'express';
import http from "http";
import { Server } from "socket.io";
import dotenv from 'dotenv';
import multer from 'multer';
import cron from "node-cron";
import connection from './config/db';
import * as uploadController from "./controllers/upload.controller"
import uploadRouter from "./routes/upload.routes";
import verifyToken from './middleware/authJWT';
import shell from "child_process";
import { v1 as uuidv1 } from 'uuid';
import sendEmail from './utils/sendEmail';
import DataCollection from './models/dataCollection.model';
import Row from './models/row.models';
import User from './models/auth.model';
import Workspace from './models/workspace.model';
import Cell from './models/cell.models';
import setReminders from './utils/setReminders';
import scheduledReminders from './utils/scheduledReminders'
import Column from './models/column.model';
import Notification from './models/notification.model';
import app from './app';
import { helpersRunner } from './utils/helpers';
import SwiftSensorsAPIAuth from './utils/integrationApp/swiftSensors/Auth';
import SwiftSensorsIntegration from './utils/integrationApp/swiftSensors/SwiftSensorsIntegration';
import Logger from './utils/logger/Logger';
import mqtt from 'mqtt';
import axios from 'axios';

const logger = new Logger()


const sh = shell.execSync;
const uuid = uuidv1();

dotenv.config();

const port = process.env.PORT;
const db_uri = process.env.MONGODB_URI;

connection(db_uri || "");

const corsOptions = {
  origin: process.env.CORS_URL
}

const persistedDiskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
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

  for (const row of rows) {
    const dataCollection = await DataCollection.findOne({ _id: row.dataCollection })
    const workspace = await Workspace.findOne({ _id: dataCollection?.workspace })
    const columns = await Column.find({ dataCollection: dataCollection?._id })
    const cells = await Cell.find({ row: row._id });
    const user = await User.findOne({ _id: row.createdBy });

    for (const column of columns) {
      if (column.type === "priority" && row.values[column.name] === "Critical") {
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
        }, (res: Response) => null)
      }
    }
  }
}

const deleteOldNotifications = async () => {
  let today = new Date();
  let priorDate = new Date(new Date().setDate(today.getDate() - 30));
  await Notification.deleteMany({ "createdAt": { $lt: priorDate.toISOString().split("T")[0] } });
}

helpersRunner()

// const runMQTT = async () => {
//   let options = {
//     host: process.env.HIVE_BROKER_ADDRESS,
//     port: 8883,
//     protocol: "mqtts",
//     username: process.env.HIVE_BROKER_USERNAME,
//     password: process.env.HIVE_BROKER_PASSWORD,
//   };

//   let client = mqtt.connect(options as any);

//   client.on("connect", function () {
//     console.log("Connected")
//   });

//   client.on("message", async function (topic, message) {

//     const messageObject = JSON.parse(message.toString());

//     const dataCollection = await DataCollection.findOne({ _id: '67b6599947933e9ec21d2866' });
//     const rows = await Row.find({ dataCollection: dataCollection?._id, isEmpty: false });

//     for (const row of rows) {
//       if (row.values.output_name === messageObject.outputName) {
//         const status = messageObject.status == 0 ? "Off" : "On";

//         const values = { ...row.values, status };

//         const updatedRow = await Row.findByIdAndUpdate(row._id, { values }, { new: true });
//       }
//     }

//     io.emit(`mqtt/${dataCollection?.workspace}`, messageObject)
//   });

//   client.subscribe("group1/000CC8074EF2/output/relay1");
//   client.subscribe("group1/000CC8074EF2/output/relay2");
//   client.subscribe("group1/000CC8074EF2/output/relay3");
//   client.subscribe("group1/000CC8074EF2/output/relay4");
// }

// runMQTT()

const runControlByWebSync = async () => {
  const request = await axios.get(`http://${process.env.PANASONIC_CBW_URL}/state.json`, { headers: { 'Authorization': 'Basic ' + process.env.PANASONIC_CBW_KEY } });
  const data = request.data;

  console.log(data)

  for (const key of Object.keys(data)) {
    const valueFromControlByWeb = Number(data[key])
    if (!isNaN(valueFromControlByWeb) && !['lat', 'long', 'utcTime', 'timezoneOffset', 'minRecRefresh', 'downloadSettings'].includes(key)) {
      // console.log({ name: key, valueFromControlByWeb });

      const rows = await Row.find({ dataCollection: '67b6599947933e9ec21d2866' });

      for (const row of rows) {
        const rowValues = row.values;

        if (rowValues.point_id === key) {
          // console.log('Found ' + key)

          let convertedValue: string = '';

          if (rowValues.type === 'Relay Output' || rowValues.type === 'Digital Input') {
            convertedValue = valueFromControlByWeb == 0 ? 'Off' : 'On';
          }

          if (rowValues.status !== convertedValue) {
            const updatedRow = await Row.findByIdAndUpdate(row._id, { values: { ...rowValues, status: convertedValue } }, { new: true })
            io.emit(`mqtt/67b6589d47933e9ec21d22ae`);
          }

        }
      }
    }

  }
}

// runControlByWebSync();

if (process.env.APP_ENVIRONMENT === "development") {
  // cron.schedule("0 * * * * *", async () => {
  //   const integration = new SwiftSensorsIntegration();
  //   await integration.syncAll()
  //   io.emit("update swift sensor data", { msg: "Swift sensor data updated" });
  // });

  // cron.schedule("30 0 23 * * *", () => {
  //   const swiftSensorAuth = new SwiftSensorsAPIAuth();
  //   swiftSensorAuth.refreshAll();
  // })

  // cron.schedule("*/3 * * * * *", () => {
  //   runControlByWebSync()
  // })
}

if (process.env.APP_ENVIRONMENT === "production" || process.env.APP_ENVIRONMENT === "staging") {

  cron.schedule("0 0 7 * * 1,2,3,4,5", () => {
    setReminders()
  });

  cron.schedule("0 0 15 * * 1,2,3,4,5", () => {
    setReminders()
  })

  cron.schedule("0 * * * * *", () => {
    scheduledReminders();
  })

  cron.schedule("0 0,15,30,45 * * * *", () => {
    setCrititcalReminders()
  })

  cron.schedule("0 0 0 * * *", () => {
    deleteOldNotifications()
  })

  cron.schedule("0 0 23 * * 7", () => {
    changeRowPositions()
  })

  cron.schedule("0 0 23 * * *", () => {
    // setReminders()

  });
}

if (process.env.APP_ENVIRONMENT === "production") {
  cron.schedule("0 * * * * *", async () => {
    const integration = new SwiftSensorsIntegration();
    await integration.syncAll()
    io.emit("update swift sensor data", { msg: "Swift sensor data updated" });
  });

  cron.schedule("30 0 23 * * *", () => {
    const swiftSensorAuth = new SwiftSensorsAPIAuth();
    swiftSensorAuth.refreshAll();
  })

  cron.schedule("*/3 * * * * *", () => {
    runControlByWebSync()
  })
}

const changeRowPositions = async () => {
  const dcs = await DataCollection.find({});

  for (const dc of dcs) {
    const rows = await Row.find({ dataCollection: dc._id }).sort({ position: 1 });

    const increment = 1024;
    let position = increment;

    for (const row of rows) {
      const newRow = { ...row, position };

      const updatedRow = await Row.findByIdAndUpdate(row._id, { position: newRow.position }, { new: true });

      position = position + increment;
    }
  }

}

const addDefaultWorkspace = async () => {
  const users = await User.find({});

  for (const user of users) {
    let newUser = { ...user }
    if (user.workspaces[0] !== undefined) {
      newUser = { ...newUser, defaultWorkspaceId: user.workspaces[0].id.toString() };
    } else {
      newUser = { ...newUser, defaultWorkspaceId: null }
    }
    const updatedUser = await User.findByIdAndUpdate(user._id, { defaultWorkspaceId: newUser.defaultWorkspaceId }, { new: true });
  }
}

// addDefaultWorkspace()

uploadRouter.post("/uploadDocs", verifyToken, localDocUpload.array("docs", 50), uploadController.uploadDoc);
uploadRouter.post("/uploadPersistedDocs", verifyToken, persistedDocUpload.array("docs", 50), uploadController.uploadPersistedDoc);

const server = http.createServer(app);

export const io = new Server(server, { cors: { origin: process.env.CORS_URL } })

io.on("connection", (socket: any) => {
  socket.emit("con", { message: "a new client connected" });
  // logger.info("Socket.io running");
})

server.listen(port, () => {
  logger.info("[ws-server]: Server is running on port " + port)
  if (process.env.APP_ENVIRONMENT === "production") {
    const source = "/var/data/uploads/";
    const destination = "/opt/render/project/src/";
    sh(`mkdir -p ${destination}`);
    sh(`cp -r ${source} ${destination}`);
  }
});