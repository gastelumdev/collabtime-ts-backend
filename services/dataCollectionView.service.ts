import mongoose, { Document, Model, Schema } from "mongoose";
import DataCollectionView from "../models/dataCollectionView.model";

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

export const addView = async (view: IDataCollectionView) => {
    const dataCollectionView: any = view;
    const newDataCollectionView = new DataCollectionView({ ...dataCollectionView })

    newDataCollectionView.save();

    return newDataCollectionView;
}

export const editView = async (view: IDataCollectionView & { _id: string }) => {
    const dataCollectionView = view;
    await DataCollectionView.findByIdAndUpdate(dataCollectionView._id, { ...dataCollectionView }, { new: true });
}

export const removeView = async (viewId: string) => {
    const dataCollectionViewId = new mongoose.Types.ObjectId(viewId);

    await DataCollectionView.findByIdAndDelete(dataCollectionViewId)
}