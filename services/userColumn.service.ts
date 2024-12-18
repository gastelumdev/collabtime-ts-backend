import { Document, Schema, Model } from "mongoose";

export interface IUserColumn {
    userId: Schema.Types.ObjectId;
    dataCollectionId?: Schema.Types.ObjectId | null;
    dataCollectionViewId?: Schema.Types.ObjectId | null;
    columnId: Schema.Types.ObjectId;
    width: string;
}

export interface IUserColumnDocument extends IUserColumn, Document {
}

export interface IUserColumnModel extends Model<IUserColumnDocument> {
    buildUserColumn(args: IUserColumn): IUserColumnDocument;
}