import express, { Express, Request, Response } from 'express';
import http from "http";

import bodyparser from 'body-parser';
import cors from 'cors';

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
import dataCollectionViewRouter from './routes/dataCollectionView.routes';
import userGroupRouter from './routes/userGroup.routes';
import eventRouter from './routes/event.routes';
import miscRouter from './routes/misc.routes';
import resourcePlanningRoutes from './routes/apps/resourcePlanning.routes'


const app: any = express();

const corsOptions = {
    origin: process.env.CORS_URL
}

app.use(bodyparser.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static("uploads"));
app.use(cors(corsOptions));

app.get('/', (req: Request, res: Response) => {
    res.send({ title: 'Express + TypeScript Server!' })
});

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
app.use(dataCollectionViewRouter);
app.use(userGroupRouter);
app.use(eventRouter);
app.use(miscRouter);
app.use(resourcePlanningRoutes)


export default app;