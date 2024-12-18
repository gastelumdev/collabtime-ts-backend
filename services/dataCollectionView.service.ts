import mongoose, { Document, Model, Schema } from "mongoose";
import DataCollectionView from "../models/dataCollectionView.model";
import UserColumn from "../models/userColumn.model";
import { IUser } from "./auth.service";

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

export const addView = async (view: IDataCollectionView, user: IUser) => {

    const dataCollectionView: any = view;
    const newDataCollectionView = new DataCollectionView({ ...dataCollectionView })

    for (const column of view.columns) {
        const newUserColumns = new UserColumn({
            userId: user._id,
            dataCollectionViewId: dataCollectionView._id,
            columnId: column._id
        })

        newUserColumns.save();
    }

    newDataCollectionView.save();

    return newDataCollectionView;
}

export const editView = async (view: IDataCollectionView & { _id: string }, user: IUser) => {
    const viewColumns = view.columns;

    for (const viewColumn of viewColumns) {
        const userColumn = await UserColumn.findOne({ userId: user._id, dataCollectionViewId: view._id, columnId: viewColumn._id });
        if (userColumn) {
            if (viewColumn.width !== userColumn?.width) {
                const updatedColumn = await UserColumn.findByIdAndUpdate(userColumn?._id, { width: viewColumn.width });
            }
        } else {
            const newUserColumns = new UserColumn({
                userId: user._id,
                dataCollectionViewId: view._id,
                columnId: viewColumn._id,
                width: viewColumn.width
            })

            newUserColumns.save();
        }
    }

    const dataCollectionView = view;
    await DataCollectionView.findByIdAndUpdate(dataCollectionView._id, { ...dataCollectionView }, { new: true });
}

export const removeView = async (viewId: string, user: IUser) => {
    const dataCollectionViewId = new mongoose.Types.ObjectId(viewId);

    await DataCollectionView.findByIdAndDelete(dataCollectionViewId)

    const view = await DataCollectionView.findOne({ _id: dataCollectionViewId });
    const viewColumns = view?.columns;

    if (viewColumns !== undefined) {
        for (const viewColumn of viewColumns) {
            const userColumn = await UserColumn.findOne({ userId: user._id, dataCollectionViewId: view?._id, columnId: viewColumn._id });
            await UserColumn.findByIdAndDelete(userColumn?._id);
        }
    }
}