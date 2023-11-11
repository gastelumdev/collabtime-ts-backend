import { Request, Response } from "express";
import DataCollection from "../models/dataCollection.model";
import Workspace from "../models/workspace.model";
import { TDataCollection, TWorkspace } from "../types";
import Column from "../models/column.model";

export const getDataCollections = async(req: Request, res: Response) => {
    const workspace = await Workspace.findOne({_id: req?.params.workspaceId});
    const dataCollections = await DataCollection.find({workspace: workspace?._id});

    try {
        res.send(dataCollections);
    } catch (error) {
        res.send({success: false})
    }
}

export const createDataCollection = async (req: Request, res: Response) => {
    const workspace = await Workspace.findOne({_id: req?.params.workspaceId});
    const dataCollection = new DataCollection({...(req.body), workspace: workspace?._id});

    const initialColumns = [
        {
            dataCollection: dataCollection._id,
            name: "assigned_to",
            type: "Person",
            permanent: true,
            people: [],
            includeInForm: true,
            includeInExport: true,
        },
        {
            dataCollection: dataCollection._id,
            name: "priority",
            type: "Label",
            permanent: true,
            labels: [
                { title: "Low", color: "blue" },
                { title: "High", color: "orange" },
            ],
            includeInForm: true,
            includeInExport: true,
        },
        {
            dataCollection: dataCollection._id,
            name: "status",
            type: "Label",
            permanent: true,
            labels: [
                { title: "In-Progress", color: "green" },
                { title: "Complete", color: "yellow" },
            ],
            includeInForm: true,
            includeInExport: true,
        },
    ];
    const columnIds = [];

    for (const initialColumn of initialColumns) {
        const column = new Column(initialColumn);
        columnIds.push(column._id);
        column.save();
    }

    dataCollection.columns = columnIds;

    try {
        dataCollection.save();
        res.send(dataCollection);
    } catch (error) {
        res.status(400).send({success: false});
    }
}

export const updateDataCollection = async (req: Request, res: Response) => {
    try {
        const dataCollection = await DataCollection.findByIdAndUpdate(req.params.id, req.body);
        res.send(dataCollection);
    } catch (error) {
        res.status(400).send({success: false})
    }
}

export const deleteDataCollection = async (req: Request, res: Response) => {
    const dataCollectionId = req?.params.id;

    try {
        await DataCollection.findByIdAndDelete({_id: dataCollectionId});
        res.send({success: true});
    } catch (error) {
        res.status(400).send({success: false})
    }
    
}

export const getDataCollection = async (req: Request, res: Response) => {
    const dataCollection = await DataCollection.findOne({_id: req.params.id});

    try {
        res.send(dataCollection)
    } catch (error) {
        res.status(400).send({success: false});
    }
}