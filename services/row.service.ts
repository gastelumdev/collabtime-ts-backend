import { Document, Schema, Model } from "mongoose";
import { TCell } from "../types";
import { TInvitee } from "./workspace.service";
import { ITag } from "./tag.service";
import { IDocument } from "./document.service";

export interface INote {
    content: string;
    owner: string;
    createdAt: string;
    read: boolean;
    people: TInvitee[];
    images: string[];
}

export interface IRow {
    dataCollection: Schema.Types.ObjectId;
    cells: string[] | TCell[];
    assignedTo: Schema.Types.ObjectId | String;
    createdBy: Schema.Types.ObjectId | string;
    notes: string;
    notesList: INote[];
    createdAt: Date;
    tags: ITag[];
    reminder: boolean;
    complete: boolean;
    acknowledged: boolean;
    values: any;
    refs: any;
    position: number;
    docs: IDocument[];
    isParent: boolean;
    showSubrows: boolean;
    parentRowId: Schema.Types.ObjectId | string | null;
    isVisible: boolean;
}

export interface IRowDocument extends IRow, Document { }

export interface IRowModel extends Model<IRowDocument> {
    buildRow(args: IRow): IRowDocument;
}