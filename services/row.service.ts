import { Document, Schema, Model } from "mongoose";
import { TCell } from "../types";

export interface INote {
    content: string;
    owner: string;
    createdAt: string;
}

export interface IRow {
    dataCollection: Schema.Types.ObjectId;
    cells: string[] | TCell[];
    assignedTo: Schema.Types.ObjectId | String;
    notes: string;
    notesList: INote[];
    createdAt: Date;
}

export interface IRowDocument extends IRow, Document {}

export interface IRowModel extends Model<IRowDocument> {
    buildRow(args: IRow): IRowDocument;
}