import { Document, Model, Schema } from "mongoose";

export interface IDataCollectionView {
    name: string;
    description: string;
    workspace: Schema.Types.ObjectId;
    dataCollection: Schema.Types.ObjectId;
    columns: any[];
    viewers: string[];
    filters: any;
    createdAt: Date;
    public: boolean;
}

export interface IDataCollectionViewDocument extends IDataCollectionView, Document {

}

export interface IDataCollectionViewModel extends Model<IDataCollectionViewDocument> {
    buildDataCollectionView(args: IDataCollectionView): IDataCollectionViewDocument;
}