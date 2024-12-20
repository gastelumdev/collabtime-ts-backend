import { Request, Response } from "express";
import DataCollection from "../models/dataCollection.model";
import Workspace from "../models/workspace.model";
import { TDataCollection, TUser, TWorkspace } from "../types";
import Column from "../models/column.model";
import Cell from "../models/cell.models";
import Row from "../models/row.models";
import mongoose from "mongoose";
import User from "../models/auth.model";
import sendEmail from "../utils/sendEmail";
import DataCollectionView from "../models/dataCollectionView.model";
import { createPrimaryValues } from "../utils/helpers";
import { editDataCollection, IDataCollection, removeDataCollection, setupDataCollection } from "../services/dataCollection.service";
import { IWorkspace } from "../services/workspace.service";



export const getDataCollections = async (req: Request, res: Response) => {
    const workspace = await Workspace.findOne({ _id: req?.params.workspaceId });
    const dataCollections = await DataCollection.find({ workspace: workspace?._id });

    try {
        res.send(dataCollections);
    } catch (error) {
        res.send({ success: false })
    }
}

export const createDataCollection = async (req: Request, res: Response) => {
    try {
        const workspace = await Workspace.findOne({ _id: req?.params.workspaceId });
        const dataCollection = new DataCollection({ ...(req.body), workspace: workspace?._id });

        setupDataCollection(workspace as IWorkspace & { _id: string }, dataCollection, (<any>req).user);

        if (dataCollection.inParentToDisplay !== null) {
            if (['planner'].includes(dataCollection.template)) {
                const rowsOfParentToDisplay = await Row.find({ dataCollection: dataCollection.inParentToDisplay, isEmpty: false })

                for (const row of rowsOfParentToDisplay) {
                    const subDataCollection = new DataCollection({
                        ...(req.body),
                        workspace: workspace?._id,
                        belongsToAppModel: true,
                        main: false,
                        appModel: dataCollection._id,
                        inParentToDisplay: row._id
                    })

                    subDataCollection.save();
                }
            }
            if (['filtered'].includes(dataCollection.template)) {
                const dataCollectionRef = await DataCollection.findOne({ _id: dataCollection.inParentToDisplay });
                const dataCollectionRefColumns = await Column.find({ dataCollection: dataCollection.inParentToDisplay }).sort({ position: 1 });
                const dataCollectionRefColumn = dataCollectionRefColumns.find((item: any) => {
                    return true;
                });
                const dataCollectionRefLabel = dataCollectionRefColumn?.name;
                const column = new Column({
                    dataCollection: dataCollection._id,
                    name: dataCollectionRefLabel,
                    type: "reference",
                    permanent: true,
                    position: 2,
                    people: [],
                    includeInForm: true,
                    includeInExport: true,
                    dataCollectionRef: dataCollection.inParentToDisplay,
                    dataCollectionRefLabel: dataCollectionRefLabel,
                })
                column.save()

                // const dataCollectionToUpdate = await DataCollection.findOne({_id: dataCollection._id});
                const newDataCollection = { ...dataCollection.toObject(), filters: { [dataCollectionRefLabel as string]: ['__ref__'] } }
                const updatedDataCollection = await DataCollection.findByIdAndUpdate(dataCollection._id, newDataCollection, { new: true });
            }
        }

        if (workspace?._id.toString() === "675095e5347da06d5cf8180a") {
            const workspaces = await Workspace.find({ type: 'resource planning', _id: { $ne: "675095e5347da06d5cf8180a" } });

            for (const workspace of workspaces) {
                const dataCollection = new DataCollection({ ...(req.body), workspace: workspace?._id });
                setupDataCollection(workspace, dataCollection, (<any>req).user)
            }
        }

        res.send(dataCollection);
    } catch (error) {
        res.status(400).send({ success: false });
    }
}

export const updateDataCollection = async (req: Request, res: Response) => {
    try {
        const workspace = await Workspace.findOne({ _id: req.params.workspaceId });
        const dataCollection = await DataCollection.findOne({ _id: req?.params.id })
        if (workspace?._id.toString() === "675095e5347da06d5cf8180a") {
            const workspaces = await Workspace.find({ type: 'resource planning', _id: { $ne: "675095e5347da06d5cf8180a" } });

            for (const workspace of workspaces) {
                const dc = await DataCollection.findOne({ workspace: workspace._id, name: dataCollection?.name });
                await editDataCollection(workspace, req.body, dc?._id.toString(), (<any>req).user);
            }
        }
        const result = await editDataCollection(workspace as IWorkspace & { _id: string }, req.body, req?.params.id, (<any>req).user)
        res.send(result);
    } catch (error) {
        res.status(400).send({ success: false })
    }
}

export const deleteDataCollection = async (req: Request, res: Response) => {
    const dataCollectionId = new mongoose.Types.ObjectId(req?.params.id);

    try {
        const workspace = await Workspace.findOne({ _id: req.params.workspaceId });
        const dataCollection = await DataCollection.findOne({ _id: req?.params.id })
        if (workspace?._id.toString() === "675095e5347da06d5cf8180a") {
            const workspaces = await Workspace.find({ type: 'resource planning', _id: { $ne: "675095e5347da06d5cf8180a" } });

            for (const workspace of workspaces) {
                const dc = await DataCollection.findOne({ workspace: workspace._id, name: dataCollection?.name });
                if (dc) {
                    await removeDataCollection(dc?._id, (<any>req).user);
                }

            }
        }

        await removeDataCollection(dataCollectionId, (<any>req).user);

        res.send({ success: true });
    } catch (error) {
        res.status(400).send({ success: false });
    }

}

export const getDataCollection = async (req: Request, res: Response) => {
    const dataCollection = await DataCollection.findOne({ _id: req.params.id });

    try {
        res.send(dataCollection)
    } catch (error) {
        res.status(400).send({ success: false });
    }
}

export const sendForm = async (req: Request, res: Response) => {
    try {
        const dataCollection = await DataCollection.findOne({ _id: req.params.id });
        const workspace = await Workspace.findOne({ _id: dataCollection?.workspace });

        sendEmail({
            email: [req.body.email],
            subject: "Collabtime - You've been sent a request form.",
            payload: { link: `${process.env.CLIENT_URL || "http://localhost:5173"}/workspaces/${workspace?._id}/dataCollections/${dataCollection?._id}/form`, workspaceName: workspace?.name, dataCollectionName: dataCollection?.name },
            template: "./template/requestForm.handlebars",
            res
        }, () => {
        });

        res.send({ success: true });
    } catch (error) {
        res.status(400).send({ success: false })
    }
}