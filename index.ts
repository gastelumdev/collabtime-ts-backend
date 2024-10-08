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
import { Schema } from 'mongoose';
import { admin, adminColumns, adminDataCollection, adminView, noAccessColumnPermissions, noAccessDataCollectionPermissions, noAccessPermissions, noAccessViewPermissions, viewOnly, viewOnlyColumns, viewOnlyDataCollection, viewOnlyView } from './utils/defaultGroups';
import UserGroup from './models/userGroup.model';
import DataCollectionView from './models/dataCollectionView.model';


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

const deleteOldNotifications = async () => {
  let today = new Date();
  let priorDate = new Date(new Date().setDate(today.getDate() - 30));
  console.log(priorDate.toISOString().split("T")[0])
  await Notification.deleteMany({ "createdAt": { $lt: priorDate.toISOString().split("T")[0] } });
}

const convertAssignedTo = async () => {
  const rows = await Row.find({});
  for (const row of rows) {
    const assignedToArr = [];
    let assigned_to = row.values['assigned_to'];
    if (assigned_to !== undefined && assigned_to !== '' && typeof assigned_to == 'string') {

      let splitValue: any = assigned_to.split(' - ');
      let name = splitValue[0];
      let email = splitValue[1];

      if (email !== undefined) {
        assignedToArr.push({ name: splitValue[0], email: splitValue[1] });
      }
    }
    if (assignedToArr.length > 0) console.log(assignedToArr);

    row.values = { ...row.values, assigned_to: assignedToArr };

    const updatedRow = await Row.findByIdAndUpdate(row._id, { values: row.values }, { new: true });
    console.log((updatedRow as any).values);
  }

};

// convertAssignedTo();

const checkForEmptyRows = async () => {
  const rows = await Row.find({}).sort({ position: 1 });



  for (const row of rows) {
    let isEmpty = true;
    console.log({ values: row.values })
    for (const key in row.values) {
      const value = row.values[key]
      if (typeof value === "string") {
        if (value !== "") {
          isEmpty = false;
        }
      } else {
        if (value.length > 0) {
          isEmpty = false;
        }
      }
    }
    console.log(isEmpty)
    const updatedRow = await Row.findByIdAndUpdate(row._id, { isEmpty }, { new: true });
    console.log(updatedRow?.isEmpty)
  }
}

// checkForEmptyRows()

import util from 'util';

const createUserGroups = async () => {
  const workspaces = await Workspace.find({});

  // console.log(workspaces)

  const adminPermissions = admin;
  const viewOnlyPermissions = viewOnly;

  for (const workspace of workspaces) {

    const members = workspace.members;
    const users = [];
    const adminDataCollectionPermissionsResult = []
    const viewOnlyDataCollectionPermissionsResult = []
    const noAccessDataCollectionPermissionsResult = []
    const adminViewPermissionsResult = []
    const viewOnlyViewPermissionsResult = []
    const noAccessViewPermissionsResult = []

    for (const member of members) {

      const user: any = await User.findOne({ email: member.email });
      users.push(user._id.toString());
    }

    const dataCollections = await DataCollection.find({ workspace: workspace._id });

    // Admin

    for (const dataCollection of dataCollections) {
      const columns = await Column.find({ dataCollection: dataCollection._id });
      let adminDataCollectionPermissions: any = adminDataCollection;

      const columnPermissions = []

      for (const column of columns) {
        columnPermissions.push({
          column: column._id,
          name: column.name,
          permissions: adminColumns
        })
      }

      adminDataCollectionPermissions = { ...adminDataCollectionPermissions, columns: columnPermissions }

      adminDataCollectionPermissionsResult.push({
        dataCollection: dataCollection._id,
        name: dataCollection.name,
        permissions: adminDataCollectionPermissions
      })
    }

    // console.log(util.inspect(adminDataCollectionPermissionsResult, { showHidden: false, depth: null, colors: true }))

    const views = await DataCollectionView.find({ workspace: workspace._id });

    for (const view of views) {
      let adminViewPermissions: any = adminView;

      const columnPermissions = [];

      for (const column of view.columns) {
        const col = await Column.findOne({ _id: column._id });

        columnPermissions.push({
          column: col?._id,
          name: col?.name,
          permissions: adminColumns
        })
      }



      adminViewPermissions = { ...adminViewPermissions, columns: columnPermissions };

      adminViewPermissionsResult.push({
        dataCollection: view.dataCollection,
        view: view._id,
        name: view.name,
        permissions: adminViewPermissions
      })
    }

    const adminUserGroup = new UserGroup({
      name: "All Privileges",
      workspace: workspace._id,
      permissions: { ...adminPermissions, dataCollections: adminDataCollectionPermissionsResult, views: adminViewPermissionsResult },
      users: users
    })

    // console.log(adminDataCollectionPermissionsResult[1].permissions.columns)
    // console.log(adminUserGroup.permissions.dataCollections[1].permissions.columns)

    adminUserGroup.save()

    // View only

    for (const dataCollection of dataCollections) {
      const columns = await Column.find({ dataCollection: dataCollection._id });
      let viewOnlyDataCollectionPermissions: any = viewOnlyDataCollection;

      const columnPermissions = []

      for (const column of columns) {
        columnPermissions.push({
          column: column._id,
          name: column.name,
          permissions: viewOnlyColumns
        })
      }

      viewOnlyDataCollectionPermissions = { ...viewOnlyDataCollectionPermissions, columns: columnPermissions };

      viewOnlyDataCollectionPermissionsResult.push({
        dataCollection: dataCollection._id,
        name: dataCollection.name,
        permissions: viewOnlyDataCollectionPermissions
      })
    }

    for (const view of views) {
      let viewOnlyViewPermissions: any = viewOnlyView;

      const columnPermissions = [];

      for (const column of view.columns) {
        const col = await Column.findOne({ _id: column._id });

        columnPermissions.push({
          column: col?._id,
          name: col?.name,
          permissions: viewOnlyColumns
        })
      }

      viewOnlyViewPermissions = { ...viewOnlyViewPermissions, columns: columnPermissions };

      viewOnlyViewPermissionsResult.push({
        dataCollection: view.dataCollection,
        view: view._id,
        name: view.name,
        permissions: viewOnlyViewPermissions
      })
    }

    const viewOnlyUserGroup = new UserGroup({
      name: "View Only",
      workspace: workspace._id,
      permissions: { ...viewOnlyPermissions, dataCollections: viewOnlyDataCollectionPermissionsResult, views: viewOnlyViewPermissionsResult },
      users: []
    })


    viewOnlyUserGroup.save()

    // No Accsss

    for (const dataCollection of dataCollections) {
      const columns = await Column.find({ dataCollection: dataCollection._id });
      let noAccessDataCollection: any = noAccessDataCollectionPermissions;

      const columnPermissions = []

      for (const column of columns) {
        columnPermissions.push({
          column: column._id,
          name: column.name,
          permissions: noAccessColumnPermissions
        })
      }

      noAccessDataCollection = { ...noAccessDataCollectionPermissions, columns: columnPermissions }

      noAccessDataCollectionPermissionsResult.push({
        dataCollection: dataCollection._id,
        name: dataCollection.name,
        permissions: noAccessDataCollection
      })
    }

    // console.log(util.inspect(adminDataCollectionPermissionsResult, { showHidden: false, depth: null, colors: true }))

    // const views = await DataCollectionView.find({ workspace: workspace._id });

    for (const view of views) {
      let noAccessView: any = noAccessViewPermissions;

      const columnPermissions = [];

      for (const column of view.columns) {
        const col = await Column.findOne({ _id: column._id });

        columnPermissions.push({
          column: col?._id,
          name: col?.name,
          permissions: noAccessColumnPermissions
        })
      }



      noAccessView = { ...noAccessView, columns: columnPermissions };

      noAccessViewPermissionsResult.push({
        dataCollection: view.dataCollection,
        view: view._id,
        name: view.name,
        permissions: noAccessView
      })
    }

    const noAccessUserGroup = new UserGroup({
      name: "No Access",
      workspace: workspace._id,
      permissions: { ...noAccessPermissions, dataCollections: noAccessDataCollectionPermissionsResult, views: noAccessViewPermissionsResult },
      users: []
    })

    // console.log(adminDataCollectionPermissionsResult[1].permissions.columns)
    // console.log(adminUserGroup.permissions.dataCollections[1].permissions.columns)

    noAccessUserGroup.save()

    console.log(noAccessUserGroup)
  }
}

// createUserGroups();

const addPublic = async () => {
  const dataCollectionViews = await DataCollectionView.find({});

  for (const dcView of dataCollectionViews) {
    const newDcView = await DataCollectionView.findByIdAndUpdate(dcView._id, { ...dcView.toObject(), public: false });
    console.log(newDcView)
  }
}

// addPublic()

if (process.env.APP_ENVIRONMENT === "production") {

  cron.schedule("0 0 7 * * 1,2,3,4,5", () => {
    setReminders()
  });

  cron.schedule("0 0 15 * * 1,2,3,4,5", () => {
    setReminders()
  })

  cron.schedule("0 * * * * *", () => {
    console.log("Another minute by")
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
      console.log(updatedRow);

      position = position + increment;
    }
  }

}

const addDefaultWorkspace = async () => {
  const users = await User.find({});

  for (const user of users) {
    let newUser = { ...user }
    if (user.workspaces[0] !== undefined) {
      console.log({ userId: user.workspaces[0].id })
      newUser = { ...newUser, defaultWorkspaceId: user.workspaces[0].id.toString() };
    } else {
      newUser = { ...newUser, defaultWorkspaceId: null }
    }
    console.log(newUser.defaultWorkspaceId)
    const updatedUser = await User.findByIdAndUpdate(user._id, { defaultWorkspaceId: newUser.defaultWorkspaceId }, { new: true });
    console.log(updatedUser);
  }
}

// addDefaultWorkspace()

uploadRouter.post("/uploadDocs", verifyToken, localDocUpload.array("docs", 50), uploadController.uploadDoc);
uploadRouter.post("/uploadPersistedDocs", verifyToken, persistedDocUpload.array("docs", 50), uploadController.uploadPersistedDoc);

const server = http.createServer(app);

export const io = new Server(server, { cors: { origin: process.env.CORS_URL } })

io.on("connection", (socket: any) => {
  socket.emit("con", { message: "a new client connected" });
  console.log("Socket.io running");
})

server.listen(port, () => {
  console.log("[ws-server]: Server is running on port " + port)
  if (process.env.APP_ENVIRONMENT === "production") {
    const source = "/var/data/uploads/";
    const destination = "/opt/render/project/src/";
    sh(`mkdir -p ${destination}`);
    sh(`cp -r ${source} ${destination}`);
  }
});