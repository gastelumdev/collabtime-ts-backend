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

const getDataCollectionTemplates = (template: string, dataCollectionId: string, people?: TUser[], primaryColumnName?: string, autoIncremented?: boolean, autoIncrementPrefix?: string) => {
    const itemName = {
        dataCollection: dataCollectionId,
        name: primaryColumnName || "item_name",
        type: "text",
        permanent: true,
        people: [],
        includeInForm: true,
        includeInExport: true,
        autoIncrementPrefix: autoIncrementPrefix,
        autoIncremented: autoIncremented
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
            { title: "Ready to start", color: "#121f82" },
            { title: "Working on it", color: "#146c96" },
            { title: "Pending review", color: "#FFA500" },
            { title: "Done", color: "#28B542" },
        ],
        includeInForm: true,
        includeInExport: true,
    };
    const taskName = {
        dataCollection: dataCollectionId,
        name: primaryColumnName || "task",
        type: "text",
        permanent: true,
        people: [],
        includeInForm: true,
        includeInExport: true,
        autoIncrementPrefix: autoIncrementPrefix,
        autoIncremented: autoIncremented
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
            itemName,
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
    const workspace = await Workspace.findOne({ _id: req?.params.workspaceId });
    const dataCollection = new DataCollection({ ...(req.body), workspace: workspace?._id });

    const people: any = [];

    for (const member of workspace?.members || []) {
        let person = await User.findOne({ email: member.email })
        people.push(person);
    }

    let initialColumns: any = [];
    let initialColumnsFromUserTemplate: any = [];

    if (dataCollection.template == "default" || dataCollection.template == "tasks") {
        initialColumns = getDataCollectionTemplates(dataCollection.template, dataCollection._id, people, dataCollection.primaryColumnName, dataCollection.autoIncremented, dataCollection.autoIncrementPrefix);
    } else {
        const columns = await Column.find({ dataCollection: dataCollection.template });
        initialColumnsFromUserTemplate = columns;
    }

    console.log(initialColumns)
    const columnIds = [];
    const values: any = {};

    let position = 1;

    for (const initialColumn of initialColumns || []) {
        const column = new Column(initialColumn);
        column.position = position;
        position++;
        columnIds.push(column._id);
        column.save();
        values[column.name] = "";
    }

    for (const initialColumnFromUser of initialColumnsFromUserTemplate) {
        const column = new Column({
            dataCollection: dataCollection._id,
            name: initialColumnFromUser.name,
            type: initialColumnFromUser.type,
            position: initialColumnFromUser.position,
            permanent: initialColumnFromUser.permanent,
            people: initialColumnFromUser.people,
            labels: initialColumnFromUser.labels,
            dataCollectionRef: initialColumnFromUser.dataCollectionRef,
            includeInForm: initialColumnFromUser.includeInForm,
            includeInExport: initialColumnFromUser.includeInExport,
            autoIncremented: initialColumnFromUser.autoIncremented,
            autoIncrementPrefix: initialColumnFromUser.autoIncrementPrefix

        });
        console.log("NEW COLUMN", column)
        column.save();
        values[column.name] = "";
    }

    dataCollection.columns = columnIds;

    for (let i = 1; i <= 50; i++) {
        let newRow;
        if (dataCollection.autoIncremented) {
            newRow = {
                dataCollection: dataCollection._id,
                values: { ...values, [dataCollection.primaryColumnName]: createPrimaryValues(i, dataCollection.autoIncrementPrefix) },
                position: i * 1024,
            }
        } else {
            newRow = {
                dataCollection: dataCollection._id,
                values: values,
                position: i * 1024,
            }
        }
        const row = new Row(newRow)
        row.save();
    }

    try {
        dataCollection.save();
        res.send(dataCollection);
    } catch (error) {
        res.status(400).send({ success: false });
    }
}

export const updateDataCollection = async (req: Request, res: Response) => {
    try {
        console.log("DATACOLLECTION", req.body)
        const dataCollection = await DataCollection.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.send(dataCollection);
    } catch (error) {
        res.status(400).send({ success: false })
    }
}

export const deleteDataCollection = async (req: Request, res: Response) => {
    const dataCollectionId = new mongoose.Types.ObjectId(req?.params.id);

    try {
        await Cell.deleteMany({ dataCollection: dataCollectionId });
        await Row.deleteMany({ dataCollection: dataCollectionId });
        await Column.deleteMany({ dataCollection: dataCollectionId });
        await DataCollectionView.deleteMany({ dataCollection: dataCollectionId });
        await DataCollection.findByIdAndDelete({ _id: dataCollectionId });
        res.send({ success: true });
    } catch (error) {
        console.log(error)
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
        console.log("EMAIL", req.body.email)
        const dataCollection = await DataCollection.findOne({ _id: req.params.id });
        const workspace = await Workspace.findOne({ _id: dataCollection?.workspace });

        sendEmail({
            email: [req.body.email],
            subject: "Collabtime - You've been sent a request form.",
            payload: { link: `${process.env.CLIENT_URL || "http://localhost:5173"}/workspaces/${workspace?._id}/dataCollections/${dataCollection?._id}/form`, workspaceName: workspace?.name, dataCollectionName: dataCollection?.name },
            template: "./template/requestForm.handlebars",
            res
        }, () => {
            console.log("Email sent")
        });

        res.send({ success: true });
    } catch (error) {
        console.log(error)
        res.status(400).send({ success: false })
    }
}