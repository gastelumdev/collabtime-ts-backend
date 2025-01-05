import { Document, Schema, Model } from "mongoose";
import Event from "../models/event.model";
import { IUser } from "./auth.service";
import { IDataCollection } from "./dataCollection.service";
import { IWorkspace } from "./workspace.service";
import dotenv from 'dotenv';
import Logger from "../utils/logger/Logger";
import { io } from "..";
import sendEmail from "../utils/sendEmail";

dotenv.config();
const logger = new Logger()

export interface IEvent {
    actionBy: IUser;
    assignee: IUser | null;
    workspace: Schema.Types.ObjectId | string;
    dataCollection: Schema.Types.ObjectId | string | null;
    type: 'system' | 'info' | 'error' | 'auth' | 'data' | 'assignment' | 'settings' | 'layout' | 'message' | 'upload';
    priority: number;
    acknowledged?: boolean;
    requiresAcknowledgement?: boolean;
    message: string;
    read?: string[];
    associatedUserIds: string[];
}

export interface IEventDocument extends IEvent, Document { }

export interface IEventModel extends Model<IEventDocument> {
    buildEvent(args: IEvent): IEventDocument;
}

export const saveEvent = (event: IEvent) => {
    if (process.env.APP_ENVIRONMENT === 'production') {
        const newEvent = new Event(event)
        newEvent.save()
    }
    if (process.env.APP_ENVIRONMENT === 'development') {
        const newEvent = new Event(event)
        newEvent.save()
    }
}

export const handleEvent = (event: IEvent, email: { email: string | string[]; subject: string; payload: { message: string; note?: string; link: string, workspaceName: string | null }, template: string } | null = null, allAssigneeIds: string[] = []) => {
    saveEvent(event)
    if (event.type === 'error') {
        logger.error(event.message);
    } else {
        logger.info(event.message);
    }
    io.emit('notify', { event, allAssigneeIds });
    io.emit('update notification marker', {})

    if (email) {
        sendEmail(email, (res: Response) => null)
    }
}