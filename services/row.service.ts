import { Document, Schema, Model } from "mongoose";

export interface IRow {
    dataCollection: Schema.Types.ObjectId;
    cells: string[];
    assignedTo: Schema.Types.ObjectId | String;
    notes: string;
    createdAt: Date;
}

export interface IRowDocument extends IRow, Document {}

export interface IRowModel extends Model<IRowDocument> {
    buildRow(args: IRow): IRowDocument;
}