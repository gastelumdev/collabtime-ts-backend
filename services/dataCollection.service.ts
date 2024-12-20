import mongoose, { Document, Schema, Model } from "mongoose";
import { ITag } from "./tag.service";
import { IWorkspace } from "./workspace.service";
import DataCollection from "../models/dataCollection.model";
import * as dataCollectionModel from "../models/dataCollection.model";
import Cell from "../models/cell.models";
import Row from "../models/row.models";
import Column from "../models/column.model";
import User from "../models/auth.model";
import { createPrimaryValues } from "../utils/helpers";
import { TDataCollection, TUser } from "../types";
import DataCollectionView from "../models/dataCollectionView.model";
import { createUserColumn, deleteUserColumn, updateUserColumn } from "./userColumn.service";
import { IUser } from "./auth.service";

export type TForm = {
    active: boolean;
    type: string;
    emails: string[];
}

export interface IDataCollection {
    name: string;
    description: string;
    workspace: Schema.Types.ObjectId;
    row?: Schema.Types.ObjectId | null;
    template: string;
    primaryColumnName: string;
    form: TForm;
    columns: string[];
    rows: string[];
    tags: ITag[];
    createdAt: Date;
    asTemplate: { active: boolean, name: string };
    formRecipients: { sent: true, email: string }[];
    autoIncremented: boolean;
    autoIncrementPrefix: string;
    belongsToAppModel?: boolean;
    main?: boolean;
    appModel?: Schema.Types.ObjectId | null;
    inParentToDisplay?: Schema.Types.ObjectId | null;
    filters?: any;
    appType?: string | null;
    userGroupAccess?: string[];
}

export interface IDataCollectionDocument extends IDataCollection, Document { }

export interface IDataCollectionModel extends Model<IDataCollectionDocument> {
    buildDataCollection(args: IDataCollection): IDataCollectionDocument
}

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
    const plannerStatus = {
        dataCollection: dataCollectionId,
        name: "status",
        type: "label",
        permanent: true,
        labels: [
            { title: "Not started", color: "#ffffff" },
            { title: "In progress", color: "#146c96" },
            { title: "Completed", color: "#046906" },
        ],
        includeInForm: true,
        includeInExport: true,
    };
    const bucket = {
        dataCollection: dataCollectionId,
        name: "bucket",
        type: "label",
        permanent: true,
        labels: [
            { title: "Initiation Todos", color: "#121f82" },
            { title: "Engineering and Design", color: "#146c96" },
            { title: "Ops", color: "#FFA500" },
            { title: "Job Closeout", color: "#28B542" },
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

    const startDate = {
        dataCollection: dataCollectionId,
        name: "start_date",
        type: "date",
        permanent: true,
        people: [],
        includeInForm: true,
        includeInExport: true,
    }
    const date = {
        dataCollection: dataCollectionId,
        name: "due_date",
        type: "date",
        permanent: true,
        people: [],
        includeInForm: true,
        includeInExport: true,
    };

    const todo = {
        dataCollection: dataCollectionId,
        name: "todo",
        type: "text",
        permanent: true,
        people: [],
        includeInForm: true,
        includeInExport: true,
    }

    const item_number = {
        dataCollection: dataCollectionId,
        name: "item_number",
        type: "text",
        permanent: true,
        people: [],
        includeInForm: true,
        includeInExport: true,
    }

    if (template === "tasks") {
        return [
            itemName,
            assignedTo,
            priority,
            status,
            date,
        ];
    }

    if (template === "planner") {
        return [
            todo,
            bucket,
            assignedTo,
            plannerStatus,
            startDate,
            date,
            priority,
        ]
    }

    if (template === 'filtered') {
        return [
            item_number
        ]
    }

    return [
        itemName
    ];
}

const rowAppNames = ['planner', 'filtered']

/**
 * Removes all data collections associated with a workspace.
 *
 * This function retrieves all data collections associated with the provided workspace,
 * then deletes all related rows, columns, and the data collection documents from the database.
 *
 * @param {IWorkspace & { _id: string }} workspace - The workspace object, including its ID.
 * @returns {Promise<void>} - A promise that resolves once all associated data collections and related data are deleted.
 *
 * @note This function is not part of automated testing and needs to have automated tests implemented.
 */
export const removeWorkspaceDataCollections = async (workspace: IWorkspace & { _id: string }) => {
    // Get all the data collections in the workspace
    // const dataCollections = await DataCollection.find({ workspace: workspace?._id });
    const dataCollections = await dataCollectionModel.findDataCollectionsBasedOnWorkspace(workspace);

    // Delete any data collections associated to the workspace
    for (const dataCollection of dataCollections) {
        const dataCollectionId = dataCollection._id;
        await Row.deleteMany({ dataCollection: dataCollectionId });
        await Column.deleteMany({ dataCollection: dataCollectionId });
        await DataCollection.findByIdAndDelete({ _id: dataCollectionId });
    }
}

export const setupDataCollection = async (workspace: IWorkspace & { _id: string }, dataCollection: any, user: IUser) => {
    const people: any = [];

    for (const member of workspace?.members || []) {
        let person = await User.findOne({ email: member.email })
        people.push(person);
    }

    let initialColumns: any = [];
    let initialColumnsFromUserTemplate: any = [];

    if (dataCollection.template == "default" || dataCollection.template == "tasks" || dataCollection.template == "planner" || dataCollection.template == 'filtered') {
        initialColumns = getDataCollectionTemplates(dataCollection.template, dataCollection._id, people, dataCollection.primaryColumnName, dataCollection.autoIncremented, dataCollection.autoIncrementPrefix);
    } else {
        const columns = await Column.find({ dataCollection: dataCollection.template });
        initialColumnsFromUserTemplate = columns;
    }

    const columnIds = [];
    const values: any = {};

    let position = 1;

    for (const initialColumn of initialColumns || []) {
        const column = new Column(initialColumn);
        column.position = position;
        column.primary = position === 1 ? true : false;
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

    createUserColumn(user, null, dataCollection)

    dataCollection.save();
}

export const editDataCollection = async (workspace: IWorkspace & { _id: string }, reqbody: IDataCollection & { _id: string }, dataCollectionId: string, user: IUser) => {
    if (reqbody.inParentToDisplay) {
        const dataCollections = await DataCollection.find({
            appModel: dataCollectionId
        });

        for (const dc of dataCollections) {
            const updatedDc = await DataCollection.findByIdAndUpdate(dc._id, { ...dc.toObject(), name: reqbody.name }, { new: true });
        }
    }

    const dataCollection = await DataCollection.findByIdAndUpdate(dataCollectionId, { ...reqbody, _id: dataCollectionId, workspace: workspace._id }, { new: true });


    return dataCollection;
}

export const removeDataCollection = async (dataCollectionId: mongoose.Types.ObjectId, user: IUser) => {
    const dataCollection = await DataCollection.findOne({ _id: dataCollectionId });
    if (dataCollection?.inParentToDisplay) {
        const subDataCollections = await DataCollection.find({ appModel: dataCollection._id });

        for (const subDataCollection of subDataCollections) {
            const deletedRows = await Row.deleteMany({ dataCollection: subDataCollection._id });
            const deletedDC = await DataCollection.findByIdAndDelete({ _id: subDataCollection._id });
        }
    }

    deleteUserColumn(user, null, dataCollection)

    await Cell.deleteMany({ dataCollection: dataCollectionId });
    await Row.deleteMany({ dataCollection: dataCollectionId });
    await Column.deleteMany({ dataCollection: dataCollectionId });
    await DataCollectionView.deleteMany({ dataCollection: dataCollectionId });
    await DataCollection.findByIdAndDelete({ _id: dataCollectionId });
}