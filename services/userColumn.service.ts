import { Document, Schema, Model } from "mongoose";
import { IDataCollection } from "./dataCollection.service";
import UserColumn from "../models/userColumn.model";
import { IUser } from "./auth.service";
import { IDataCollectionView } from "./dataCollectionView.service";
import DataCollection from "../models/dataCollection.model";
import Column from "../models/column.model";

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

export const createUserColumn = async (user: IUser, view: IDataCollectionView & { _id: string } | null, dc: IDataCollection & { _id: string } | null) => {
    if (view) {
        for (const column of view.columns) {
            const newUserColumns = new UserColumn({
                userId: user._id,
                dataCollectionViewId: view._id,
                dataCollectionId: null,
                columnId: column._id
            })

            newUserColumns.save();
        }
    }

    if (dc) {
        const columns = await Column.find({ dataCollection: dc._id });
        for (const column of columns) {
            const newUserColumns = new UserColumn({
                userId: user._id,
                dataCollectionViewId: null,
                dataCollectionId: dc._id,
                columnId: column._id
            })

            newUserColumns.save();
        }
    }
}

export const updateUserColumn = async (user: IUser, view: IDataCollectionView & { _id: string } | null, dc: IDataCollection & { _id: string } | null) => {
    if (view) {
        const columns = view.columns;

        for (const viewColumn of columns) {
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
    }

    if (dc) {
        const columns = await Column.find({ dataCollection: dc._id });

        for (const column of columns) {
            const userColumn = await UserColumn.findOne({ userId: user._id, dataCollectionId: dc._id, columnId: column._id });
            if (userColumn) {
                if (column.width !== userColumn?.width) {
                    const updatedColumn = await UserColumn.findByIdAndUpdate(userColumn?._id, { width: column.width });
                }
            } else {
                const newUserColumns = new UserColumn({
                    userId: user._id,
                    dataCollectionId: dc._id,
                    columnId: column._id,
                    width: column.width
                })

                newUserColumns.save();
            }
        }
    }
}

export const deleteUserColumn = async (user: IUser, view: IDataCollectionView & { _id: string } | null, dc: IDataCollection & { _id: string } | null) => {
    if (view) {
        const columns = view.columns;

        for (const viewColumn of columns) {
            const userColumn = await UserColumn.findOne({ userId: user._id, dataCollectionViewId: view._id, columnId: viewColumn._id });
            if (userColumn) {
                await UserColumn.findByIdAndDelete(userColumn?._id);
            }
        }
    }

    if (dc) {
        const columns = await Column.find({ dataCollection: dc._id });

        for (const column of columns) {
            const userColumn = await UserColumn.findOne({ userId: user._id, dataCollectionId: dc._id, columnId: column._id });
            if (userColumn) {
                await UserColumn.findByIdAndDelete(userColumn?._id);
            }
        }
    }
}