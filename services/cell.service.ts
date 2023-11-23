import { Document, Schema, Model } from "mongoose";
import { TUser } from "../types";

export type TLabel = {
    title: string;
    color: string;
}

export interface ICell {
    dataCollection: Schema.Types.ObjectId;
    row: Schema.Types.ObjectId;
    name: string;
    type: string;
    labels?: TLabel[];
    people?: TUser[];
    value: string;
    createdAt: Date;
}

export interface ICellDocument extends ICell, Document {}

export interface ICellModel extends Model<ICellDocument> {
    buildCell(args: ICell): ICellDocument;
}