import { Document, Schema, Model } from "mongoose";
import { IUser } from "./auth.service";

export interface IMessage {
    content: string;
    workspace: Schema.Types.ObjectId | null;
    createdAt: Date;
    createdBy: IUser;
    read: IUser[];
}

export interface IMessageDocument extends IMessage, Document { }

export interface IMessageModel extends Model<IMessageDocument> {
    buildMessage(args: IMessage): IMessageDocument;
}