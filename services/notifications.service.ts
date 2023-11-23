import { Document, Schema, Model } from "mongoose";

export interface INotification {
    message: string,
    workspaceId?: Schema.Types.ObjectId | null,
    assignedTo: Schema.Types.ObjectId | null,
    createdAt: Date,
    dataSource?: string,
    priority?: string,
    read: boolean,
}

export interface INotificationDocument extends INotification, Document {}

export interface INotificationModel extends Model<INotificationDocument> {
    buildNotification(args: INotification): INotificationDocument;
}