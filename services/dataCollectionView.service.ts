import { Document, Model, Schema } from "mongoose";

export interface IDataCollectionView {
    name: string;
    description: string;
    workspace: Schema.Types.ObjectId;
    dataCollection: Schema.Types.ObjectId;
    columns: any[];
    createdAt: Date;
}

export interface IDataCollectionViewDocument extends IDataCollectionView, Document {

}

export interface IDataCollectionViewModel extends Model<IDataCollectionViewDocument> {
    buildDataCollectionView(args: IDataCollectionView): IDataCollectionViewDocument;
}