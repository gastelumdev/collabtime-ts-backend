import { Document, Schema, Model } from "mongoose";

export type TLabel = {
    title: string;
    color: string;
};

export interface IColumn {
    dataCollection: Schema.Types.ObjectId;
    name: string;
    type: string;
    position: number;
    width: string;
    permanent: boolean;
    people?: string[];
    labels?: TLabel[];
    dataCollectionRef?: any;
    dataCollectionRefLabel?: any;
    includeInForm: boolean;
    includeInExport: boolean;
    autoIncremented: boolean;
    autoIncrementPrefix: string;
    primary: boolean;
    createdAt: Date;
}

export interface IColumnDocument extends IColumn, Document { }

export interface IColumnModel extends Model<IColumnDocument> {
    buildColumn(args: IColumn): IColumnDocument;
}