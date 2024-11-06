import { Document, Model, Schema } from "mongoose";

export interface IDataCollectionView {
    name: string;
    description: string;
    workspace: Schema.Types.ObjectId;
    dataCollection: Schema.Types.ObjectId;
    row?: Schema.Types.ObjectId | null;
    columns: any[];
    viewers: string[];
    filters: any;
    createdAt: Date;
    public: boolean;
    belongsToRow?: boolean;
    rowsOfDataCollection?: Schema.Types.ObjectId | null;
    main?: boolean;
    maxNumberOfItems?: number | null;
}

export interface IDataCollectionViewDocument extends IDataCollectionView, Document {

}

export interface IDataCollectionViewModel extends Model<IDataCollectionViewDocument> {
    buildDataCollectionView(args: IDataCollectionView): IDataCollectionViewDocument;
}