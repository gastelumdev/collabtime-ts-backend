import { Request, Response } from "express";
import DataCollectionView from "../models/dataCollectionView.model";
import Column from "../models/column.model";
import mongoose from "mongoose";
import UserGroup from "../models/userGroup.model";
import { admin, adminColumns, adminView, viewOnly, viewOnlyColumns, viewOnlyView } from "../utils/defaultGroups";
import util from 'util';
import DataCollection from "../models/dataCollection.model";
import Row from "../models/row.models";
import { addView, editView, IDataCollectionView, removeView } from "../services/dataCollectionView.service";
import Workspace from "../models/workspace.model";
import { IColumn } from "../services/column.service";
import UserColumn from "../models/userColumn.model";

export const getDataCollectionViews = async (req: Request, res: Response) => {
    try {
        const dataCollectionViews = await DataCollectionView.find({ workspace: req?.params.workspaceId });
        const response: any = [];

        for (const dataCollectionView of dataCollectionViews) {
            const dataCollectionViewCopy = dataCollectionView;
            const columns: any = []
            for (const viewColumn of dataCollectionView.columns) {

                const dcColumn = await Column.findById({ _id: viewColumn._id })
                if (dcColumn) {
                    const userColumn = await UserColumn.findOne({ dataCollectionViewId: dataCollectionView._id, userId: (<any>req).user._id, columnId: viewColumn._id })

                    columns.push({ ...dcColumn?.toObject(), width: userColumn?.width });
                }

            }
            dataCollectionViewCopy.columns = columns;

            if (dataCollectionViewCopy.viewers.includes((<any>req).user._id.toString()) || dataCollectionView.public) {
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

export const getDataCollectionViewById = async (req: Request, res: Response) => {
    console.log(req.params.dataCollectionViewId)
    try {
        const view = await DataCollectionView.findOne({ _id: req.params.dataCollectionViewId });
        console.log(view)
        res.send(view)
    } catch (err) {
        res.status(400).send({ success: false })
    }
}

export const createDataCollectionView = async (req: Request, res: Response) => {
    try {
        const workspace = await Workspace.findOne({ _id: req.params.workspaceId });
        const dataCollection = await DataCollection.findOne({ _id: req.body.dataCollection });
        if (workspace?._id.toString() === "675095e5347da06d5cf8180a") {
            const workspaces = await Workspace.find({ type: 'resource planning', _id: { $ne: "675095e5347da06d5cf8180a" } });

            for (const workspace of workspaces) {
                const dc = await DataCollection.findOne({ workspace: workspace?._id, name: dataCollection?.name });
                const columns = await Column.find({ dataCollection: dc?._id }).sort({ position: 1 });

                const originalColumnIds = req.body.columns.map((item: IColumn & { _id: string }) => {
                    return item.name;
                })

                const filteredColumns = columns.filter((item: IColumn & { _id: string }) => {
                    return originalColumnIds.includes(item.name);
                })

                await addView({ ...req.body, workspace: workspace._id, dataCollection: dc?._id, columns: filteredColumns }, (<any>req).user);
            }
        }
        const newDataCollectionView = await addView(req.body, (<any>req).user);


        res.send(newDataCollectionView)
    } catch (err) {
        res.status(400).send({ success: false })
    }
}

export const updateDataCollectionView = async (req: Request, res: Response) => {
    try {
        const workspace = await Workspace.findOne({ _id: req.params.workspaceId });
        const dataCollectionView = await DataCollectionView.findOne({ _id: req.body._id })
        const dataCollection = await DataCollection.findOne({ _id: dataCollectionView?.dataCollection });

        if (workspace?._id.toString() === "675095e5347da06d5cf8180a") {
            const workspaces = await Workspace.find({ type: 'resource planning', _id: { $ne: "675095e5347da06d5cf8180a" } });

            for (const workspace of workspaces) {
                const dc = await DataCollection.findOne({ workspace: workspace?._id, name: dataCollection?.name });
                const view = await DataCollectionView.findOne({ name: dataCollectionView?.name, dataCollection: dc?._id, workspace: workspace?._id })

                const columns = await Column.find({ dataCollection: dc?._id }).sort({ position: 1 });

                const originalColumnIds = req.body.columns.map((item: IColumn & { _id: string }) => {
                    return item.name;
                })

                const filteredColumns = columns.filter((item: IColumn & { _id: string }) => {
                    return originalColumnIds.includes(item.name);
                })

                await editView({ ...req.body, _id: view?._id, workspace: workspace?._id, dataCollection: dc?._id, columns: filteredColumns }, (<any>req).user);
            }
        }
        await editView(req.body as IDataCollectionView & { _id: string }, (<any>req).user)

        res.send({ success: true });
    }
    catch (err) {
        res.status(400).send({ success: false });
    }
}

export const deleteDataCollectionView = async (req: Request, res: Response) => {
    try {
        const workspace = await Workspace.findOne({ _id: req.params.workspaceId });
        const dataCollectionView = await DataCollectionView.findOne({ _id: req.params.dataCollectionViewId })
        const dataCollection = await DataCollection.findOne({ _id: dataCollectionView?.dataCollection });

        if (workspace?._id.toString() === "675095e5347da06d5cf8180a") {
            const workspaces = await Workspace.find({ type: 'resource planning', _id: { $ne: "675095e5347da06d5cf8180a" } });

            for (const workspace of workspaces) {
                const dc = await DataCollection.findOne({ workspace: workspace?._id, name: dataCollection?.name });
                const view = await DataCollectionView.findOne({ name: dataCollectionView?.name, dataCollection: dc?._id, workspace: workspace?._id })

                await removeView(view?._id, (<any>req).user);
            }
        }
        await removeView(req?.params.dataCollectionViewId, (<any>req).user)

        res.send({ success: true });
    } catch (err) {
        res.status(400).send({ success: true })
    }
}