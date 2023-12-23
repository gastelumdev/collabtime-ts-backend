import { Document, Schema, Model } from "mongoose";
import { TUser } from "../types";
import { IDocument } from "./document.service";

export type TLabel = {
    title: string;
    color: string;
}

export interface ICell {
    dataCollection: Schema.Types.ObjectId;
    row: Schema.Types.ObjectId;
    name: string;
    type: string;
    position: number;
    labels?: TLabel[];
    people?: TUser[];
    docs?: IDocument[];
    links: string[];
    value: string;
    createdAt: Date;
}

export interface ICellDocument extends ICell, Document {}

export interface ICellModel extends Model<ICellDocument> {
    buildCell(args: ICell): ICellDocument;
}