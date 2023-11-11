import { Document, Schema, Model } from "mongoose";

export type TForm = {
    active: boolean;
    type: string;
    emails: string[];
}

export interface IDataCollection {
    name: string;
    description: string;
    workspace: Schema.Types.ObjectId;
    form: TForm;
    columns: string[];
    rows: string[];
    createdAt: Date;
}

export interface IDataCollectionDocument extends IDataCollection, Document {}

export interface IDataCollectionModel extends Model<IDataCollectionDocument> {
    buildDataCollection(args: IDataCollection): IDataCollectionDocument;
}
