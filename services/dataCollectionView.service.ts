import mongoose, { Document, Model, Schema } from "mongoose";
import DataCollectionView from "../models/dataCollectionView.model";
import UserColumn from "../models/userColumn.model";
import { IUser } from "./auth.service";
import { createUserColumn, deleteUserColumn, updateUserColumn } from "./userColumn.service";

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
    position?: number;
}

export interface IDataCollectionViewDocument extends IDataCollectionView, Document {

}

export interface IDataCollectionViewModel extends Model<IDataCollectionViewDocument> {
    buildDataCollectionView(args: IDataCollectionView): IDataCollectionViewDocument;
}

export const addView = async (view: IDataCollectionView, user: IUser) => {

    const dataCollectionView: any = view;
    const newDataCollectionView = new DataCollectionView({ ...dataCollectionView })

    createUserColumn(user, newDataCollectionView, null);

    newDataCollectionView.save();

    return newDataCollectionView;
}

export const editView = async (view: IDataCollectionView & { _id: string }, user: IUser) => {
    updateUserColumn(user, view, null);

    const dataCollectionView = view;
    await DataCollectionView.findByIdAndUpdate(dataCollectionView._id, { ...dataCollectionView }, { new: true });
}

export const removeView = async (viewId: string, user: IUser) => {
    const dataCollectionViewId = new mongoose.Types.ObjectId(viewId);

    await DataCollectionView.findByIdAndDelete(dataCollectionViewId)

    const view = await DataCollectionView.findOne({ _id: dataCollectionViewId });
    deleteUserColumn(user, view, null);
}