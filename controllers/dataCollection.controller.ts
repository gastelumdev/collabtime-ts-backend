import { Request, Response } from "express";
import DataCollection from "../models/dataCollection.model";
import Workspace from "../models/workspace.model";
import { TDataCollection, TUser, TWorkspace } from "../types";
import Column from "../models/column.model";
import Cell from "../models/cell.models";
import Row from "../models/row.models";
import mongoose from "mongoose";
import User from "../models/auth.model";

const getDataCollectionTemplates = (template: string, dataCollectionId: string, people?: TUser[]) => {
    const itemName = {
        dataCollection: dataCollectionId,
        name: "item_name",
        type: "text",
        permanent: true,
        people: [],
        includeInForm: true,
        includeInExport: true,
    };
    const assignedTo = {
        dataCollection: dataCollectionId,
        name: "assigned_to",
        type: "people",
        permanent: true,
        people: people,
        includeInForm: true,
        includeInExport: true,
    };
    const priority = {
        dataCollection: dataCollectionId,
        name: "priority",
        type: "priority",
        permanent: true,
        labels: [
            { title: "Low", color: "#28B542" },
            { title: "High", color: "#FFA500" },
            { title: "Critical", color: "#FF0000" },
        ],
        includeInForm: true,
        includeInExport: true,
    };
    const status = {
        dataCollection: dataCollectionId,
        name: "status",
        type: "status",
        permanent: true,
        labels: [
            { title: "Working on it", color: "#FFA500" },
            { title: "Done", color: "#28B542" },
        ],
        includeInForm: true,
        includeInExport: true,
    };
    const taskName = {
        dataCollection: dataCollectionId,
        name: "task",
        type: "text",
        permanent: true,
        people: [],
        includeInForm: true,
        includeInExport: true,
    };
    const date = {
        dataCollection: dataCollectionId,
        name: "due_date",
        type: "date",
        permanent: true,
        people: [],
        includeInForm: true,
        includeInExport: true,
    };

    if (template === "tasks") {
        return [
            taskName,
            assignedTo,
            priority,
            status,
            date,
        ];
    }
        
    return [
        itemName,
        assignedTo,
        priority,
    ];
}


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

    const people: any = [];

    for (const member of workspace?.members || []) {
        let person = await User.findOne({email: member.email});
        people.push(person);
    }

    const initialColumns = getDataCollectionTemplates(dataCollection.template, dataCollection._id, people);
    console.log(initialColumns)
    const columnIds = [];

    let position = 1;

    for (const initialColumn of initialColumns) {
        const column = new Column(initialColumn);
        column.position = position;
        position++;
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
    const dataCollectionId = new mongoose.Types.ObjectId(req?.params.id);

    try {
        await Cell.deleteMany({dataCollection: dataCollectionId});
        await Row.deleteMany({dataCollection: dataCollectionId});
        await Column.deleteMany({dataCollection: dataCollectionId});
        await DataCollection.findByIdAndDelete({_id: dataCollectionId});
        res.send({success: true});
    } catch (error) {
        console.log(error)
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