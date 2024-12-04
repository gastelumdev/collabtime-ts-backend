import { Request, Response } from "express";
import DataCollection from "../models/dataCollection.model";
import Column from "../models/column.model";
import Row from "../models/row.models";
import Cell from "../models/cell.models";
import Workspace from "../models/workspace.model";
import User from "../models/auth.model";
import { io } from "../index";
import { TLabel } from "../types";
import { editColumn, IColumn, removeColumn, setupColumn } from "../services/column.service";
import { IWorkspace } from "../services/workspace.service";
import { IDataCollection } from "../services/dataCollection.service";

export const getColumns = async (req: Request, res: Response) => {


    try {
        const dataCollection = await DataCollection.findOne({ _id: req.params.dataCollectionId });
        const columns = await Column.find({ dataCollection: dataCollection?._id }).sort("position");

        res.send(columns);
    } catch (error) {
        res.status(400).send({ success: false });
    }
}

export const getWorkspaceColumns = async (req: Request, res: Response) => {
    // const dataCollection = await DataCollection.findOne({ _id: req.params.dataCollectionId });
    // const workspace = await Workspace.findOne({ _id: dataCollection?.workspace });

    try {
        const dataCollections = await DataCollection.find({ workspace: req.params.workspaceId });

        const response = []

        for (const dc of dataCollections) {
            const columns = await Column.find({ dataCollection: dc._id });

            for (const col of columns) {
                response.push(col);
            }
        }
        res.send(response);
    } catch (error) {
        res.status(400).send({ success: false });
    }
}

export const createColumn = async (req: Request, res: Response) => {
    try {
        const workspace = await Workspace.findOne({ _id: req.params.workspaceId })
        const dataCollection = await DataCollection.findOne({ _id: req.params.dataCollectionId });
        const rows = await Row.find({ dataCollection: dataCollection?._id });

        // Get columns to check if column with that name already exists
        const columns = await Column.find({ dataCollection: dataCollection?._id });
        const columnsLength = columns.length;

        for (const column of columns) {
            if (column.name == req.body.name) {
                io.emit("update", { message: "Column already exists." })
                res.status(400).send({ success: false })
            }
        }

        const column = await setupColumn(workspace as IWorkspace & { _id: string }, dataCollection as IDataCollection & { _id: string }, req.body, columnsLength, rows);

        if (workspace?._id.toString() === "675095e5347da06d5cf8180a") {
            const workspaces = await Workspace.find({ type: 'resource planning', _id: { $ne: "675095e5347da06d5cf8180a" } });

            for (const workspace of workspaces) {
                const dc = await DataCollection.findOne({ workspace: workspace._id, name: dataCollection?.name });
                const columns = await Column.find({ dataCollection: dc?._id });
                const rows = await Row.find({ dataCollection: dc?._id });
                const columnsLength = columns.length;

                const col = await setupColumn(workspace as IWorkspace & { _id: string }, dc as IDataCollection & { _id: string }, req.body, columnsLength, rows);
            }
        }

        res.send(column);
    } catch (error) {
        res.status(400).send({ success: false })
    }
}

export const updateColumn = async (req: Request, res: Response) => {
    try {
        const prevColumn: any = await Column.findById(req.params.id);
        const newColumn: any = req.body;

        const workspace = await Workspace.findOne({ _id: req.params.workspaceId });
        const dataCollection = await DataCollection.findOne({ _id: req.params.dataCollectionId })

        if (workspace?._id.toString() === "675095e5347da06d5cf8180a") {
            const workspaces = await Workspace.find({ type: 'resource planning', _id: { $ne: "675095e5347da06d5cf8180a" } });

            for (const workspace of workspaces) {
                const dc = await DataCollection.findOne({ workspace: workspace?._id, name: dataCollection?.name });
                const column = await Column.findOne({ dataCollection: dc?._id, name: prevColumn.name });

                await editColumn(prevColumn, newColumn, dc?._id, column?._id)
            }
        }

        const result = await editColumn(prevColumn, newColumn, newColumn.dataCollection, req.params.id);
        res.send(result);
    } catch (error) {
        res.status(400).send({ success: false })
    }
}

export const deleteColumn = async (req: Request, res: Response) => {
    try {
        const workspace = await Workspace.findOne({ _id: req.params.workspaceId });
        const dataCollection = await DataCollection.findOne({ _id: req.params.dataCollectionId })
        if (workspace?._id.toString() === "675095e5347da06d5cf8180a") {
            const workspaces = await Workspace.find({ type: 'resource planning', _id: { $ne: "675095e5347da06d5cf8180a" } });

            for (const workspace of workspaces) {
                const dc = await DataCollection.findOne({ workspace: workspace?._id, name: dataCollection?.name });
                const column = await Column.findOne({ dataCollection: dc?._id, name: req.body.name });

                await removeColumn(column as IColumn & { _id: string }, dc?._id);
            }
        }
        await removeColumn(req.body, req.params.dataCollectionId)
        res.send({ success: true });
    } catch (error) {
        res.status(400).send({ success: false })
    }
}

export const reorderColumns = async (req: Request, res: Response) => {
    const columns = req.body;

    try {
        for (let i = 1; i <= columns.length; i++) {
            const newColumn: any = await Column.findOne({ _id: columns[i - 1]._id });
            newColumn.position = i;
            await newColumn?.save();
        }
        res.send({ success: true });
    }
    catch (error) {
        res.status(400).send({ success: false });
    }
}