import { Document, Schema, Model } from "mongoose";
import { ITag } from "./tag.service";

export type TForm = {
    active: boolean;
    type: string;
    emails: string[];
}

export interface IDataCollection {
    name: string;
    description: string;
    workspace: Schema.Types.ObjectId;
    template: string;
    form: TForm;
    columns: string[];
    rows: string[];
    tags: ITag[];
    createdAt: Date;
    asTemplate: {active: boolean, name: string};
    formRecipients: {sent: true, email: string}[];
}

export interface IDataCollectionDocument extends IDataCollection, Document {}

export interface IDataCollectionModel extends Model<IDataCollectionDocument> {
    buildDataCollection(args: IDataCollection): IDataCollectionDocument
}
