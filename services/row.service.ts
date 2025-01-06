import { Document, Schema, Model } from "mongoose";
import { TCell } from "../types";
import { IWorkspace, TInvitee } from "./workspace.service";
import { ITag } from "./tag.service";
import { IDocument } from "./document.service";
import Column from "../models/column.model";
import { IDataCollection } from "./dataCollection.service";
import DataCollection from "../models/dataCollection.model";
import Row from "../models/row.models";
import User from "../models/auth.model";
import Notification from "../models/notification.model";
import { io } from "../index";
import sendEmail from "../utils/sendEmail";
import { getAllAssigneeIds, IUser } from "./auth.service";
import { addBlankRows, checkIfLastRow } from "../utils/rows";
import Treemap from "../utils/integrationApp/swiftSensors/Treemap";
import Threshold from "../utils/integrationApp/swiftSensors/Threshold";
import SwiftSensorsIntegration from "../utils/integrationApp/swiftSensors/SwiftSensorsIntegration";
import { fToC } from "../utils/helpers";
import { handleIntegrationAppValueChange } from "../utils/integrationApp";
import { handleResourcePlanningAppValueChange } from "../utils/resourcePlanningApp";
import { handleEvent } from "./event.service";

export interface INote {
    content: string;
    owner: string;
    createdAt: string;
    read: boolean;
    people: TInvitee[];
    images: string[];
}

export interface IReminder {
    title: string;
    date: string;
    comments: string;
}

export interface IRow {
    dataCollection: Schema.Types.ObjectId;
    cells: string[] | TCell[];
    assignedTo: Schema.Types.ObjectId | String[] | null;
    createdBy: Schema.Types.ObjectId | string;
    notes: string;
    notesList: INote[];
    createdAt: Date;
    tags: ITag[];
    reminder: boolean;
    reminders: IReminder[];
    complete: boolean;
    acknowledged: boolean;
    values: any;
    refs: any;
    position: number;
    docs: IDocument[];
    isParent: boolean;
    showSubrows: boolean;
    parentRowId: Schema.Types.ObjectId | string | null;
    isVisible: boolean;
    isEmpty: boolean;
    archived: boolean;
}

export interface IRowDocument extends IRow, Document { }

export interface IRowModel extends Model<IRowDocument> {
    buildRow(args: IRow): IRowDocument;
}

/**
 * Updates references in all rows across all data collections in a workspace if a specific column value changes.
 * 
 * @param {IWorkspace & { _id: string } | null} workspace - The workspace object containing an ID.
 * @param {IDataCollection & { _id: string } | null} dataCollection - The data collection object containing an ID.
 * @param {IRow & { _id: string } | null} row - The original row object containing an ID.
 * @param {IRow} newRow - The new row object with updated values.
 */
export const updateRefs = async (workspace: IWorkspace & { _id: string } | null, dataCollection: IDataCollection & { _id: string } | null, row: IRow & { _id: string } | null, newRow: IRow) => {
    const columns: any = await Column.find({ dataCollection: dataCollection?._id, position: 1 })
    const columnName = columns[0].name;



    // If the value from the body coming in is different than the existing row
    if (row?.values[columnName] !== newRow.values[columnName]) {
        // Get all the data collections in the workspace
        const dataCollections = await DataCollection.find({ workspace: workspace?._id });
        // Go through each data collection
        for (const dc of dataCollections) {
            // Get all the rows for the current data collection
            const rows = await Row.find({ dataCollection: dc._id });
            // Go through each row
            for (const r of rows) {
                const refs = r.refs;
                let modify = false;
                // Go through each set of refs
                for (const key in refs) {
                    // Go through each individual ref
                    for (const i in refs[key]) {
                        // If the row id is the same as the as the id of the nested ref
                        // replace the existing ref with the data of the row coming in
                        // and flag it to be modified
                        if (row?._id.toString() === refs[key][i]._id) {
                            r.refs[key][i] = newRow;
                            modify = true;
                        }
                    }
                }

                if (modify) {
                    const newRow = await Row.findByIdAndUpdate(r._id, r, { new: true });
                }
            }
        }
    }
}

/**
 * Handles changes to the "assigned_to" field of a row, sending notifications and emails if the assigned user changes.
 * 
 * @param {IWorkspace & { _id: string } | null} workspace - The workspace object containing an ID.
 * @param {IDataCollection & { _id: string } | null} dataCollection - The data collection object containing an ID.
 * @param {IRow & { _id: string } | null} row - The original row object containing an ID.
 * @param {IRow} newRow - The new row object with updated values.
 * @param {IUser | null} assigner - The user who made the assignment change.
 */
export const handleAssignedTo = async (workspace: IWorkspace & { _id: string } | null, dataCollection: IDataCollection & { _id: string } | null, row: IRow & { _id: string } | null, newRow: IRow, assigner: IUser | null) => {
    // If the assigned to, priority, or status change
    if (newRow.values["assigned_to"] && (newRow.values["assigned_to"].length > row?.values["assigned_to"].length)) {
        for (const assignee of newRow.values['assigned_to']) {
            // Get the email out of the assigned_to value and find that user
            const email = assignee.email;
            const user = await User.findOne({ email: email });
            // Emit a message to the frontend to trigger a toast notification and to update the row
            io.emit(user?._id || "", { message: `New Assignment in ${workspace?.name} - ${dataCollection?.name}` });
            // io.emit("update row", { message: "" });
            // Send an email to the assignee.
            sendEmail({
                email: email,
                subject: `New Assignment in ${workspace?.name} - ${dataCollection?.name}`,
                payload: {
                    message: `${workspace?.name} - ${dataCollection?.name} assignment has been assigned by ${assigner?.firstname} ${assigner?.lastname}`,
                    link: `${process.env.CLIENT_URL || "http://localhost:5173"}/workspaces/${workspace?._id}/dataCollections/${dataCollection?._id}`,
                    dataCollectionName: dataCollection?.name,
                },
                template: "./template/dataCollectionStatusChange.handlebars",
                // res,
            }, (res: Response) => null)

            // sendCriticalRowEmail(req.body);
        }

    }
}

/**
 * Handles the addition of a new note to a row, sending notifications and updating the frontend if the notes list changes.
 * @param {IWorkspace & { _id: string } | null} workspace - The workspace object containing an ID.
 * @param {IDataCollection & { _id: string } | null} dataCollection - The data collection object containing an ID.
 * @param {IRow & { _id: string } | null} row - The original row object containing an ID.
 * @param {IRow} newRow - The new row object with updated values.
 * @param {IUser | null} assigner - The user who added the new note.
 */
export const handleNewNote = async (workspace: IWorkspace & { _id: string } | null, dataCollection: IDataCollection & { _id: string } | null, row: IRow & { _id: string } | null, newRow: IRow, assigner: IUser | null) => {
    // if there are more notes in the req body than in the db, then there is a new note
    // in which we want to notify the user and update the frontend via sockets
    if (row?.notesList.length !== newRow.notesList.length) {

        const columns = await Column.find({ dataCollection: dataCollection?._id });
        const allAssigneeIds = await getAllAssigneeIds(columns, newRow);
        let allAssigneeEmails = [];

        for (const assigneeId of allAssigneeIds) {
            const user = await User.findOne({ _id: assigneeId });
            if (user) {
                allAssigneeEmails.push(user?.email);
            }
        }

        const columnName = dataCollection?.primaryColumnName || columns[0].name;

        const note = `Note: "${row?.notesList[row?.notesList.length - 1].content}"`;

        const message = `A new note has been created in ${row?.values[columnName]} in ${dataCollection?.name} by ${assigner?.firstname} ${assigner?.lastname}.`

        handleEvent({
            actionBy: assigner as IUser,
            assignee: null,
            workspace: workspace?._id as string,
            dataCollection: dataCollection?._id as string,
            type: 'info',
            priority: 100,
            message,
            associatedUserIds: allAssigneeIds as string[]
        }, {
            email: allAssigneeEmails,
            subject: `New note in ${workspace?.name} - ${dataCollection?.name}`,
            payload: {
                message,
                note,
                link: `${process.env.CLIENT_URL || "http://localhost:5173"}/workspaces/${workspace?._id}/dataCollections/${dataCollection?._id}`,
                workspaceName: workspace ? workspace?.name : null,
            },
            template: "./template/newNote.handlebars",
            // res,
        }, allAssigneeIds as string[])
    }
}

/**
 * Handles the acknowledgment of a row, sending an email notification to the row's creator if the row is acknowledged.
 * @param {IWorkspace & { _id: string } | null} workspace - The workspace object containing an ID.
 * @param {IDataCollection & { _id: string } | null} dataCollection - The data collection object containing an ID.
 * @param {IRow & { _id: string } | null} row - The original row object containing an ID.
 * @param {IRow} newRow - The new row object with updated values.
 * @param {IUser | null} assigner - The user who acknowledged the row.
 */
export const handleAcknowledgedRow = async (workspace: IWorkspace & { _id: string } | null, dataCollection: IDataCollection & { _id: string } | null, row: IRow & { _id: string } | null, newRow: IRow, assigner: IUser | null) => {
    // if existing row has not been acknowledged,
    // send an email to the row creator
    if (row?.acknowledged === false && newRow.acknowledged === true) {
        const columns = await Column.find({ dataCollection: dataCollection?._id });
        const allAssigneeIds = await getAllAssigneeIds(columns, newRow);
        const rowOwner = await User.findOne({ _id: row.createdBy });
        const message = `${dataCollection?.name} assignment has been acknowledged by ${assigner?.firstname} ${assigner?.lastname}`;
        handleEvent({
            actionBy: assigner as IUser,
            assignee: null,
            workspace: workspace?._id as string,
            dataCollection: dataCollection?._id as string,
            type: 'acknowledgement',
            priority: 100,
            message,
            associatedUserIds: allAssigneeIds as string[]
        }, {
            email: rowOwner?.email || "",
            subject: `Collabtime Acknowledgment - ${workspace?.name}`,
            payload: {
                message,
                link: `${process.env.CLIENT_URL || "http://localhost:5173"}/workspaces/${workspace?._id}/dataCollections/${dataCollection?._id}`,
                dataCollectionName: dataCollection?.name
            },
            template: "./template/rowAcknowledgement.handlebars"
        }, allAssigneeIds as string[])
    }
}

/**
 * Handles the completion status of a row and its child rows based on the "status" field.
 * @param {IRow & { _id: string } | null} row - The original row object containing an ID.
 * @param {IRow & { _id: string }} newRow - The new row object with updated values containing an ID.
 */
export const handleCompletedRow = async (row: IRow & { _id: string } | null, newRow: IRow & { _id: string }) => {
    // If row is not completed and it has a status
    if (row?.values["status"] !== undefined && row?.values["status"] !== newRow.values["status"]) {
        // If row is not yet set as complete
        if (!row?.complete) {
            // If status is done
            if (newRow.values["status"] === "Done") {
                // Set the row to complete
                newRow.complete = true;

                // Find all the row's children and set them to complete as well
                const rows = await Row.find({ parentRowId: newRow._id });
                for (const row of rows) {
                    row.complete = true;
                    row.values["status"] = newRow.values["status"];

                    await Row.findByIdAndUpdate(row._id, row, { new: true });
                }
            }
        } else {
            // Else if it is set as complete and status is any other status than done
            if (newRow.values["status"] !== "Done") {
                // Set the row to incomplete
                newRow.complete = false;

                // And also it's child rows
                const rows = await Row.find({ parentRowId: newRow._id });
                for (const row of rows) {
                    row.complete = false;
                    row.values["status"] = newRow.values["status"];

                    await Row.findByIdAndUpdate(row._id, row, { new: true });
                }
            }
        }
    }
}

/**
 * Handles the update of the last row in a data collection, adding blank rows if necessary.
 * @param {IDataCollection & { _id: string } | null} dataCollection - The data collection object containing an ID.
 * @param {IRow & { _id: string } | null} row - The original row object containing an ID.
 * @param {IRow} newRow - The new row object with updated values.
 * @param {IUser | null} assigner - The user who updated the row.
 * @returns {Promise<any[]>} A promise that resolves to an array of blank rows added.
 */
export const handleLastRowUpdate = async (dataCollection: IDataCollection & { _id: string } | null, row: IRow & { _id: string } | null, newRow: IRow, assigner: IUser | null) => {
    const isLastRow = await checkIfLastRow(row);

    let blankRows: any = [];

    if (isLastRow) {

        // Get the values and the position of the row passed in which is the last row in the list
        const lastRowValues = newRow.values;
        let lastRowPosition: any = newRow.position;

        // Way to keep track of how many non empty values there is
        let numberOfValues = 0;

        // if any of the last row's values are not empty increase the number of values
        for (const key in lastRowValues) {
            if (lastRowValues[key] !== '') {
                numberOfValues++;
            }
        }
        if (numberOfValues >= 1) {
            blankRows = await addBlankRows(dataCollection, assigner, 10, lastRowPosition);
        }

        return blankRows;
    }
}

export const handleRowEmptiness = async (newRow: IRow & { _id: string }) => {
    if (!rowIsEmpty(newRow)) {
        await Row.findByIdAndUpdate(newRow._id, { isEmpty: false }, { new: true });
    } else {
        await Row.findByIdAndUpdate(newRow._id, { isEmpty: true }, { new: true });
    }
}

export const rowIsEmpty = (row: IRow & { _id: string }) => {
    let isEmpty = true;
    for (const key in row.values) {
        const value = row.values[key]
        if (typeof value === "string") {
            if (value !== "") {
                isEmpty = false;
            }
        } else {
            if (value) {
                if (value.length > 0) {
                    isEmpty = false;
                }
            }

        }
    }

    return isEmpty;
}

export const handleAppValueChanges = async (row: IRow, reqbody: IRow & { _id: string }, workspace: IWorkspace & { _id: string }, dataCollection: IDataCollection & { _id: string }) => {
    if (workspace?.type === "integration") {
        handleIntegrationAppValueChange(row, reqbody, workspace, dataCollection);
    }

    if (workspace?.type === 'resource planning') {
        handleResourcePlanningAppValueChange(row as IRow & { _id: string }, reqbody, workspace, dataCollection);
    }
}



export const handleNotifyingUsersOnLabelChange = async (row: IRow, reqbody: IRow, workspace: IWorkspace & { _id: string }, dataCollection: IDataCollection & { _id: string }) => {
    let newValue = null;

    // Handles notifying users based on new value
    for (const key of Object.keys(reqbody.values)) {
        const value = reqbody.values[key];
        if (typeof value === 'string') {
            if (row?.values[key] !== value) {
                newValue = { key, value };
            }
        }
    }

    if (newValue) {
        const column = await Column.findOne({ dataCollection: dataCollection?._id, name: newValue?.key });
        if (column?.labels) {
            for (const label of column?.labels) {
                if (label.users) {
                    if (label.title === newValue.value) {
                        for (const user of label.users) {
                            sendEmail({
                                email: user || "",
                                subject: `Collabtime Notification - ${workspace?.name}`,
                                payload: {
                                    message: `${workspace?.name} - ${dataCollection?.name} \nA value in the ${newValue.key} column has changed to ${newValue.value}`,
                                    link: `${process.env.CLIENT_URL || "http://localhost:5173"}/workspaces/${workspace?._id}`,
                                    dataCollectionName: dataCollection?.name,
                                    workspaceName: workspace?.name,
                                },
                                template: "./template/rowAcknowledgement.handlebars"
                            }, () => {

                            })
                        }
                    }

                }
            }
        }

    }
}