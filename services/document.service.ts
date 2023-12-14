import { Document, Schema, Model } from "mongoose";
import { IUser } from "./auth.service";
import { ITag } from "./tag.service";

export interface IDocument {
    workspace: Schema.Types.ObjectId;
    createdBy: IUser | null;
    filename: string;
    type: string; // "upload" | "created"
    originalname?: string;
    url?: string;
    ext: string;
    value?: string;
    file?: any;
    tags: ITag[]
}

export interface IDocumentDocument extends IDocument, Document {}

export interface IDocumentModel extends Model<IDocumentDocument> {
    buildDocument(args: IDocument): IDocumentDocument;
}