import { Document, Schema, Model } from "mongoose";

export interface IDocument {
    workspace: Schema.Types.ObjectId;
    filename: string;
    type: string;
    originalname?: string;
    url?: string;
    ext: string;
    value?: string;
    file?: any;
}

export interface IDocumentDocument extends IDocument, Document {}

export interface IDocumentModel extends Model<IDocumentDocument> {
    buildDocument(args: IDocument): IDocumentDocument;
}