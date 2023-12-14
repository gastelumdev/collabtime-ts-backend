import { Request, Response } from "express";
import Workspace from "../models/workspace.model";
import DataCollection from "../models/dataCollection.model";
import Document from "../models/document.model";
import User from "../models/auth.model";
import { IWorkspace } from "../services/workspace.service";
import { IDataCollection } from "../services/dataCollection.service";
import { IDocument } from "../services/document.service";
import Column from "../models/column.model";
import { IColumn } from "../services/column.service";
import Row from "../models/row.models";
import { IRow } from "../services/row.service";
import Cell from "../models/cell.models";

export const searchAll = async (req: Request, res: Response) => {
    try {
        const key = req.body.key;
        const user = await User.findOne({_id: (<any>req).user._id});
        const workspaceIds: string[] = [];
        const workspaces: IWorkspace[] = []

        for (const userWorkspace of user?.workspaces || []) {
            workspaceIds.push(userWorkspace.id);
        }

        for (const workspaceId of workspaceIds) {
            let workspace: any = await Workspace.findOne({_id: workspaceId, $or:[{name: key !== "" ? new RegExp(`^${key}`, 'i')  : ""}]});
            if (workspace) workspaces.push(workspace);
        }

        const dataCollections = await DataCollection.find({$or:[{name: key !== "" ? new RegExp(`^${key}`, 'i')  : ""}], workspace: workspaceIds});
        // const dataCollections = await DataCollection.find({name: new RegExp(`^${key}`, 'i'), workspace: workspaceIds});
        
        const docs = await Document.find({$or: [{filename: key !== "" ? new RegExp(`^${key}`, 'i')  : ""}], workspace: workspaceIds});

        console.log(workspaces)
        console.log("DATA COLLECTIONS", dataCollections)

        res.send({workspaces, dataCollections, docs});
    } catch (error) {
        console.log(error);
        res.status(400).send({success: false})
    }
}

export const searchTags = async (req: Request, res: Response) => {
    console.log(req.body.tag);
    try {
        const tag = req.body.tag;
        const user = await User.findOne({_id: (<any>req).user._id});
        const workspaceIds: string[] = [];
        const workspaces: IWorkspace[] = [];
        const dataCollections: IDataCollection[] = [];
        const documents: IDocument[] = [];
        const data: any[] = [];

        for (const userWorkspace of user?.workspaces || []) {
            workspaceIds.push(userWorkspace.id);
        }

        for (const workspaceId of workspaceIds) {
            let workspace: any = await Workspace.findOne({_id: workspaceId});

            if (workspace) {
                for (const workspaceTag of workspace.tags) {
                    console.log(workspaceTag.name)
                    if (tag !== "" && workspaceTag.name.startsWith(tag)) workspaces.push(workspace);
                }
            }
        }

        const dataCollectionsQuery = await DataCollection.find({workspace: workspaceIds});
        for (const dataCollection of dataCollectionsQuery) {
            for (const dataCollectionTag of dataCollection.tags) {
                if (tag !== "" && dataCollectionTag.name.startsWith(tag)) dataCollections.push(dataCollection)
            }
        }

        const documentsQuery = await Document.find({workspace: workspaceIds});
        for (const document of documentsQuery) {
            for (const documentTag of document.tags) {
                if (tag !== "" && documentTag.name.startsWith(tag)) documents.push(document)
            }
        }

        for (const workspaceId of workspaceIds) {
            const dataCollections = await DataCollection.find({workspace: workspaceId});
            for (const dataCollection of dataCollections) {
                let rowsQuery = await Row.find({dataCollection: dataCollection._id});
                let columns: IColumn[] = [];
                let rows: any[] = [];
                let rowsResult: any[] = [];
                // Shape data
                for (const row of rowsQuery) {
                    console.log("ROW", row)

                    for (const rowTag of row.tags) {
                        if (tag !== "" && rowTag.name.startsWith(tag)) rows.push(row);
                    }
                }

                if (rows.length > 0) {
                    for (const columnId of dataCollection.columns) {
                        const column: any = await Column.findOne({_id: columnId});
                        columns.push(column);
                    }

                    for (const i in rows) {
                        const cells = [];

                        for (const cell of rows[i].cells) {
                            const cellQuery = await Cell.findOne({_id: cell});
                            cells.push(cellQuery);
                        }

                        rows[i].cells = cells;
                    }

                    data.push({dataCollection, rows, columns});
                }
            }
            
        }

        console.log(data)

        res.send({workspaces, dataCollections, docs: documents, data});
    } catch (error) {
        res.status(400).send({success: false})
    }
}