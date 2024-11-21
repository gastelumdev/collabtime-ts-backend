import { Request, Response } from "express";
import DataCollectionView from "../models/dataCollectionView.model";
import Column from "../models/column.model";
import mongoose from "mongoose";
import UserGroup from "../models/userGroup.model";
import { admin, adminColumns, adminView, viewOnly, viewOnlyColumns, viewOnlyView } from "../utils/defaultGroups";
import util from 'util';
import DataCollection from "../models/dataCollection.model";
import Row from "../models/row.models";

export const getDataCollectionViews = async (req: Request, res: Response) => {
    try {
        console.log("GETTING DATA COLLECTION VIEWS")
        const dataCollectionViews = await DataCollectionView.find({ workspace: req?.params.workspaceId });
        const response: any = [];

        console.log(dataCollectionViews)

        for (const dataCollectionView of dataCollectionViews) {

            const dataCollectionViewCopy = dataCollectionView;
            const columns: any = []
            for (const column of dataCollectionView.columns) {
                const col = await Column.findById({ _id: column._id })
                columns.push(col);
            }
            dataCollectionViewCopy.columns = columns;

            // if (dataCollectionView.public) console.log(dataCollectionView)

            if (dataCollectionViewCopy.viewers.includes((<any>req).user._id) || dataCollectionView.public) {
                response.push(dataCollectionViewCopy);
            }

        }

        res.send(response);
    } catch (err) {
        res.status(400).send({ success: false })
    }
}

export const getDataCollectionViewsByRowId = async (req: Request, res: Response) => {
    try {
        const views = await DataCollectionView.find({ row: req.params.rowId })
        res.send(views)
    } catch (err) {
        res.status(400).send({ success: false })
    }

}

export const createDataCollectionView = async (req: Request, res: Response) => {
    try {
        const dataCollectionView: any = req.body;

        console.log(dataCollectionView)

        // const dataCollectionContainingSelectableRows = await DataCollection.findOne({ _id: dataCollectionView.rowsOfDataCollection });
        // const selectableRows = await Row.find({ dataCollection: dataCollectionContainingSelectableRows?._id });

        // for (const row of selectableRows) {
        //     console.log(row)
        //     const newDataCollectionView = new DataCollectionView({ ...dataCollectionView, viewers: [], row: row._id })

        //     console.log(newDataCollectionView)

        //     newDataCollectionView.save();
        // }

        const newDataCollectionView = new DataCollectionView({ ...dataCollectionView })

        console.log(newDataCollectionView)

        newDataCollectionView.save();

        const userGroups = await UserGroup.find({ dataCollection: dataCollectionView.dataCollection });

        const dataCollectionViewColumns = dataCollectionView.columns;



        for (const userGroup of userGroups) {
            const newColumnPermissions = []
            for (const dataCollectionViewColumn of dataCollectionViewColumns) {
                newColumnPermissions.push({ column: dataCollectionViewColumn._id, name: dataCollectionViewColumn.name, permissions: userGroup.name === "All Privileges" ? adminColumns : viewOnlyColumns })
            }

            const newViews = [...userGroup.permissions.views, { name: dataCollectionView?.name, view: newDataCollectionView.toObject()._id, dataCollection: dataCollectionView.dataCollection, permissions: userGroup.name === "All Privileges" ? { ...adminView, columns: newColumnPermissions } : { ...viewOnlyView, columns: newColumnPermissions } }]

            const newUserGroup = { ...userGroup, permissions: { ...userGroup.permissions, views: newViews } }

            const updatedUserGroup = await UserGroup.findByIdAndUpdate(userGroup._id, newUserGroup)

            console.log(util.inspect(newUserGroup))
            console.log(updatedUserGroup?.permissions.views)
        }



        res.send(newDataCollectionView)
    } catch (err) {
        res.status(400).send({ success: false })
    }
}

export const updateDataCollectionView = async (req: Request, res: Response) => {
    try {

        const dataCollectionView = req.body;

        await DataCollectionView.findByIdAndUpdate({ _id: dataCollectionView._id }, { ...dataCollectionView }, { new: true });

        res.send({ success: true });
    }
    catch (err) {
        res.status(400).send({ success: false });
    }
}

export const deleteDataCollectionView = async (req: Request, res: Response) => {
    try {
        const dataCollectionViewId = new mongoose.Types.ObjectId(req?.params.dataCollectionViewId);

        await DataCollectionView.findByIdAndDelete(dataCollectionViewId)

        res.send({ success: true });
    } catch (err) {
        res.status(400).send({ success: true })
    }
}