import { Request, Response } from "express";
import DataCollection from "../models/dataCollection.model"
import Column from "../models/column.model";
import Row from "../models/row.models";
import Cell from "../models/cell.models";
import Notification from "../models/notification.model";
import { ICell } from "../services/cell.service";
import { TCell, TUser } from "../types";
import Workspace from "../models/workspace.model";
import User from "../models/auth.model";
import { io } from "../index";
import sendEmail from "../utils/sendEmail";
import { addBlankRows, checkIfLastRow } from "../utils/rows";
import { IRow, handleAcknowledgedRow, handleAssignedTo, handleCompletedRow, handleAppValueChanges, handleLastRowUpdate, handleNewNote, handleNotifyingUsersOnLabelChange, handleRowEmptiness, rowIsEmpty, updateRefs } from "../services/row.service";
import { IWorkspace } from "../services/workspace.service";
import UserGroup from "../models/userGroup.model";
import Threshold from "../utils/integrationApp/swiftSensors/Threshold";
import Treemap from "../utils/integrationApp/swiftSensors/Treemap";
import { fToC } from "../utils/helpers";
import DataCollectionView from "../models/dataCollectionView.model";
import SwiftSensorsIntegration from "../utils/integrationApp/swiftSensors/SwiftSensorsIntegration";
import { IDataCollection } from "../services/dataCollection.service";
import Event from "../models/event.model"
import { handleEvent, saveEvent } from "../services/event.service";
import { getAllAssigneeIds, IUser } from "../services/auth.service";

export const getRows = async (req: Request, res: Response) => {

    try {
        const user = await User.findOne({ _id: (<any>req).user._id });
        const sort = Number(req.query.sort) === 1 || req.query.sort === undefined ? 1 : -1;
        const skip = req.query.skip === undefined ? 0 : Number(req.query.skip);
        const limit = req.query.limit === undefined ? 0 : Number(req.query.limit);
        const archived = req.query.archived === 'undefined' ? false : Boolean(req.query.archived);

        const showEmptyRows = req.query.showEmptyRows !== undefined ? req.query.showEmptyRows === 'false' ? false : true : true;
        const showCreateRow = req.query.showCreateRow !== undefined ? req.query.showCreateRow === 'false' ? false : true : true;

        const sortBy: string = (req.query.sortBy === "createdAt" || req.query.sortBy === undefined ? "createdAt" : `values.${req.query.sortBy}`) as string;

        const dataCollection = await DataCollection.findOne({ _id: req.params.dataCollectionId });
        const workspace = await Workspace.findOne({ _id: dataCollection?.workspace })

        let filters = null;
        let appModel: any = null;
        let userGroupName = "";
        if (dataCollection?.appModel) {
            appModel = await DataCollection.findOne({ _id: dataCollection?.appModel })
            filters = appModel && appModel.filters && appModel.filters !== undefined ? appModel.filters : {};

            const userGroups = await UserGroup.find({ workspace: appModel?.workspace });

            for (const ug of userGroups) {
                const users = ug.users;

                for (const uid of users) {
                    if (uid === user?._id.toString()) {
                        userGroupName = ug.name;
                    }
                }
            }
        } else {
            filters = req.query.filters !== 'undefined' ? JSON.parse(req.query.filters as string) : {};
        }
        let rows;

        if (showEmptyRows) {
            rows = await Row.find({ dataCollection: dataCollection?._id, archived: archived }).sort({ position: sort }).skip(skip).limit(limit);
        } else {
            rows = await Row.find({ dataCollection: dataCollection?._id, isEmpty: false, archived: archived }).sort({ position: sort }).skip(skip).limit(limit);
            const nextEmptyRow = await Row.findOne({ dataCollection: dataCollection?._id, isEmpty: true, archived: archived }).sort({ position: sort })
            if (nextEmptyRow) {
                if (showCreateRow) {
                    rows.push(nextEmptyRow)
                }

            }

        }

        for (const filter of Object.keys(filters)) {
            const filterVals = filters[filter]

            rows = rows.filter((row: any) => {
                if (row.isEmpty) return true;
                const refs = row.refs[filter];
                if (appModel?.userGroupAccess?.includes(userGroupName)) {
                    return true;
                }

                let existsInRef = false;
                const lowerCaseValues = filterVals.map((item: string) => {
                    return item.toLowerCase()
                })

                if (refs !== undefined && refs.length > 0) {

                    for (const ref of refs) {
                        if (lowerCaseValues.includes(ref.values["item_name"].toLowerCase())) {
                            existsInRef = true;
                            return true
                        }

                    }
                } else {
                    let isMatch = false;
                    if (row.values[filter] !== undefined) {
                        if (typeof row.values[filter] !== 'string') {

                            for (const person of row.values[filter]) {
                                if (lowerCaseValues.includes(person.name.toLowerCase())) {
                                    return true;
                                }

                                if (lowerCaseValues.length > 0) {
                                    if (lowerCaseValues[0] === "__user__") {

                                        if (person.email === user?.email) {

                                            isMatch = true;
                                        }
                                    }
                                }

                            }
                            return isMatch
                        }
                        return lowerCaseValues.includes(row.values[filter].toLowerCase());
                    }

                }
            })
        }

        res.send(rows);

    } catch (error) {
        res.status(400).send({ success: false });
    }
}

export const getRow = async (req: Request, res: Response) => {
    try {
        const row = await Row.findOne({ _id: req.params.rowId });

        res.send(row);
    } catch (error) {
        res.status(400).send({ success: false });
    }
}

export const getRowById = async (req: Request, res: Response) => {
    try {
        const row = await Row.findOne({ _id: req.params.rowId });

        res.send(row);
    } catch (error) {
        res.status(400).send({ success: false });
    }
}

export const createRow = async (req: Request, res: Response) => {


    try {
        const user = await User.findOne({ _id: (<any>req).user._id });
        const dataCollection = await DataCollection.findOne({ _id: req.params.dataCollectionId });
        const columns = await Column.find({ dataCollection: dataCollection?._id });

        let values: any = {};

        for (const column of columns) {
            values[column.name] = "";
        }
        const row = new Row(req.body);
        row.values = values;

        row.createdBy = user?._id || "";
        row.dataCollection = dataCollection?._id || ""
        await row.save();
        res.send(row);

    } catch (error) {
        res.status(400).send({ success: false })
    }
}

const sendCriticalRowEmail = async (row: IRow) => {
    const dataCollection = await DataCollection.findOne({ _id: row.dataCollection });
    const workspace = await Workspace.findOne({ _id: dataCollection?.workspace });
    const columns = await Column.find({ dataCollection: row.dataCollection });
    let priority = "";
    let email = "";

    for (const column of columns) {
        if (column.type === "priority") {
            priority = row.values[column.name];
        }
        if (column.type === "people") {
            email = row.values[column.name].split(" - ").pop();
        }
    }

    if (email !== "" && priority !== "") {
        if (priority === "Critical") {
            const user = await User.findOne({ email: email });

            // io.emit(user?._id || "", { message: "You have been assigned to a data collection task." })

            // needs email ****************************
            const link = `${process.env.CLIENT_URL || "http://localhost:5173"}/workspaces/${workspace?._id}/dataCollections/${dataCollection?._id}?acknowledgedRow=${(row as any)._id}`;
            sendEmail({
                email: email,
                subject: `New Assignment in ${workspace?.name} - ${dataCollection?.name}`,
                payload: {
                    message: `Hi ${user?.firstname}, you have been assigned a critical item in ${workspace?.name} - ${dataCollection?.name}.`,
                    link: link,
                    dataCollectionName: dataCollection?.name,
                },
                template: "./template/dataCollectionStatusChange.handlebars",
                // res,
            }, (res: Response) => null);

            io.emit(user?._id || "", {
                message: `You have been assigned a critical item in ${workspace?.name} - ${dataCollection?.name}.`,
                priority: "Critical"
            });
            io.emit("update row", { message: "" });


            // const notification = new Notification({
            //     message: `${noteCreator?.firstname} ${noteCreator?.lastname} has added a new note to ${dataCollection?.name[0].toUpperCase()}${dataCollection?.name.slice(1)} Data Collection`,
            //     workspaceId: workspace?._id,
            //     assignedTo: user?._id,
            //     dataSource: "",
            //     priority: "Low",
            //     read: false,
            // })
            // notification.save();
        }
    }
}

export const updateRow = async (req: Request, res: Response) => {
    try {
        const row = await Row.findOne({ _id: req.params.id });
        const workspace = await Workspace.findOne({ _id: req.params.workspaceId });
        let dataCollection = await DataCollection.findOne({ _id: req.params.dataCollectionId });
        const assigner = await User.findOne({ _id: (<any>req).user._id });

        if (dataCollection?.main) {
            if (dataCollection?.inParentToDisplay && !rowIsEmpty(req.body)) {
                const subDataCollections = await DataCollection.find({ appModel: dataCollection?._id, main: false });
                if (row?.isEmpty) {

                    for (const dc of subDataCollections) {
                        const newRow = new Row({
                            dataCollection: dc._id,
                            values: req.body.values,
                            position: row?.position,
                            isEmpty: false
                        })
                        newRow.save()
                    }
                } else {
                    for (const dc of subDataCollections) {
                        const existingRow = await Row.findOne({ position: req.body.position, dataCollection: dc._id });
                        const primaryColumn = await Column.findOne({ dataCollection: dc.appModel, primary: true });
                        const updatedRow = await Row.findByIdAndUpdate(existingRow?._id, { ...existingRow?.toObject(), values: req.body.values });

                    }
                }
            }
        } else {
            dataCollection = await DataCollection.findOne({ _id: dataCollection?.appModel })
        }

        // Set the first user to interact with the row as the creator
        if (req.body.isEmpty) req.body.createdBy = assigner?._id;
        // req.body.isEmpty = false;

        // Update the row
        await Row.findByIdAndUpdate(req.params.id, req.body, { new: true });
        // Updates references in all rows across all data collections in a workspace if a specific column value changes.
        updateRefs(workspace, dataCollection, row, req.body);
        // Handles changes to the "assigned_to" field of a row, sending notifications and emails if the assigned user changes.
        // handleAssignedTo(workspace, dataCollection, row, req.body, assigner);

        // Handles the addition of a new note to a row, sending notifications and updating the frontend if the notes list changes.
        handleNewNote(workspace, dataCollection, row, req.body, assigner);
        // Handles the acknowledgment of a row, sending an email notification to the row's creator if the row is acknowledged.
        handleAcknowledgedRow(workspace, dataCollection, row, req.body, assigner)
        // Handles the completion status of a row and its child rows based on the "status" field.
        handleCompletedRow(row, req.body)
        // Sets row to empty/non-empty based on its values
        // handleRowEmptiness(req.body);

        handleAppValueChanges(row as IRow, req.body, workspace as IWorkspace & { _id: string }, dataCollection as IDataCollection & { _id: string }, assigner as IUser)

        handleNotifyingUsersOnLabelChange(row as IRow, req.body, workspace as IWorkspace & { _id: string }, dataCollection as IDataCollection & { _id: string }, assigner)

        // Handles the update of the last row in a data collection, adding blank rows if necessary.
        const blankRows = await handleLastRowUpdate(dataCollection, row, req.body, assigner);

        const columns = await Column.find({ dataCollection: dataCollection?._id });
        const allAssigneeIds = await getAllAssigneeIds(columns, req.body);

        for (const column of columns) {
            const newRow = req.body;
            if (column.type !== 'people' && column.type !== 'reference') {
                if (row?.values[column.name] !== req.body.values[column.name]) {
                    handleEvent({
                        actionBy: assigner as IUser,
                        assignee: null,
                        workspace: workspace?._id as string,
                        dataCollection: dataCollection?._id as string,
                        type: 'data',
                        priority: 100,
                        message: `Row value changed from "${row?.values[column.name]}" to "${req.body.values[column.name]}" in ${dataCollection?.name} data collection by ${assigner?.firstname} ${assigner?.lastname}.`,
                        associatedUserIds: allAssigneeIds as string[]
                    }, null, allAssigneeIds as string[])
                }
            } else if (column.type === 'people') {
                const newRowUsers = newRow.values[column.name] || [];
                const prevRowUsers = row?.values[column.name] == '' || row?.values[column.name] === undefined ? [] : row?.values[column.name];

                if (newRowUsers.length > prevRowUsers.length) {
                    for (const user of newRowUsers) {
                        const missingUser = prevRowUsers.find((item: { name: string, email: string }) => {
                            return item.email === user.email;
                        });

                        if (missingUser === undefined) {
                            const selectedUser = await User.findOne({ email: user.email });
                            const message = `An item was assigned to ${selectedUser?.firstname} ${selectedUser?.lastname} by ${assigner?.firstname} ${assigner?.lastname} in "${dataCollection?.name}" data collection.`;
                            handleEvent({
                                actionBy: assigner as IUser,
                                assignee: selectedUser,
                                workspace: workspace?._id as string,
                                dataCollection: dataCollection?._id as string,
                                type: 'assignment',
                                priority: 100,
                                message,
                                associatedUserIds: allAssigneeIds as string[]
                            }, {
                                email: user.email,
                                subject: `Assigned Item in ${workspace?.name} - ${dataCollection?.name}`,
                                payload: {
                                    message,
                                    link: `${process.env.CLIENT_URL || "http://localhost:5173"}/workspaces/${workspace?._id}/dataCollections/${dataCollection?._id}`,
                                    workspaceName: workspace ? workspace?.name : null,
                                },
                                template: "./template/event.handlebars",
                                // res,
                            }, [selectedUser?._id] as string[])
                        }
                    }
                }

                if (newRowUsers.length < prevRowUsers.length) {
                    for (const user of prevRowUsers) {
                        const missingUser = newRowUsers.find((item: { name: string, email: string }) => {
                            return item.email === user.email;
                        });

                        if (missingUser === undefined) {
                            const deselectedUser = await User.findOne({ email: user.email });
                            const message = `An item was unassigned from ${deselectedUser?.firstname} ${deselectedUser?.lastname} by ${assigner?.firstname} ${assigner?.lastname} ${deselectedUser?.lastname} in "${dataCollection?.name}" data collection.`
                            handleEvent({
                                actionBy: assigner as IUser,
                                assignee: deselectedUser,
                                workspace: workspace?._id as string,
                                dataCollection: dataCollection?._id as string,
                                type: 'assignment',
                                priority: 100,
                                message,
                                associatedUserIds: allAssigneeIds as string[]
                            }, {
                                email: user.email,
                                subject: `Unassigned Item in ${workspace?.name} - ${dataCollection?.name}`,
                                payload: {
                                    message,
                                    link: `${process.env.CLIENT_URL || "http://localhost:5173"}/workspaces/${workspace?._id}`,
                                    workspaceName: dataCollection ? dataCollection?.name : null,
                                },
                                template: "./template/event.handlebars",
                                // res,
                            }, [deselectedUser?._id] as string[]);
                        }
                    }
                }

            } else if (column.type === 'reference') {
                let newRowRefs = newRow.refs || {};
                let rowRefs = row?.refs || {};

                if (newRowRefs[column.name] === undefined) {
                    newRowRefs[column.name] = [];
                }

                if (rowRefs[column.name] === undefined) {
                    rowRefs[column.name] = [];
                }

                if (newRowRefs[column.name].length > rowRefs[column.name].length) {

                    for (const ref of newRowRefs[column.name]) {
                        const missingRef = rowRefs[column.name].find((item: any) => {
                            return item._id === ref._id;
                        })

                        if (missingRef === undefined) {
                            const referencedDataCollection = await DataCollection.findOne({ _id: ref.dataCollection })

                            handleEvent({
                                actionBy: assigner as IUser,
                                assignee: null,
                                workspace: workspace?._id as string,
                                dataCollection: dataCollection?._id as string,
                                type: 'data',
                                priority: 100,
                                message: `A reference of ${ref.values[column.dataCollectionRefLabel]} in ${referencedDataCollection?.name} data collection was added by ${assigner?.firstname} ${assigner?.lastname} in "${dataCollection?.name}" data collection.`,
                                associatedUserIds: allAssigneeIds as string[]
                            }, null, allAssigneeIds as string[]);

                        }
                    }
                }

                if (newRowRefs[column.name].length < rowRefs[column.name].length) {
                    for (const ref of rowRefs[column.name]) {
                        const missingRef = newRowRefs[column.name].find((item: any) => {
                            return item._id === ref._id;
                        });

                        if (missingRef === undefined) {
                            const referencedDataCollection = await DataCollection.findOne({ _id: ref.dataCollection })

                            handleEvent({
                                actionBy: assigner as IUser,
                                assignee: null,
                                workspace: workspace?._id as string,
                                dataCollection: dataCollection?._id as string,
                                type: 'data',
                                priority: 100,
                                message: `A reference of ${ref.values[column.dataCollectionRefLabel]} in ${referencedDataCollection?.name} data collection was removed by ${assigner?.firstname} ${assigner?.lastname} in "${dataCollection?.name}" data collection.`,
                                associatedUserIds: allAssigneeIds as string[]
                            }, null, allAssigneeIds as string[]);
                        }
                    }
                }

            } else {
                handleEvent({
                    actionBy: assigner as IUser,
                    assignee: null,
                    workspace: workspace?._id as string,
                    dataCollection: dataCollection?._id as string,
                    type: 'data',
                    priority: 100,
                    message: "A modification was made that was not recorded",
                    associatedUserIds: allAssigneeIds as string[]
                })
            }

        }



        io.emit("update views", { message: "" });
        // Send the blank rows for the frontend to have
        res.send(blankRows);
    } catch (error) {
        res.status(400).send({ success: false });
    }
}

export const deleteRow = async (req: Request, res: Response) => {
    const row = await Row.findOne({ _id: req.params.id })
    const user = await User.findOne({ _id: (<any>req).user._id });
    const workspace = await Workspace.findOne({ _id: req.params.workspaceId })
    let cells: any = row?.cells;

    const dataCollection = await DataCollection.findOne({ _id: row?.dataCollection });

    if (dataCollection?.appModel && !dataCollection.main) {
        const subDataCollections = await DataCollection.find({ appModel: dataCollection._id });

        for (const subDc of subDataCollections) {
            const appRowsToDelete = await Row.find({ position: row?.position, dataCollection: subDc._id });

            for (const rowToDelete of appRowsToDelete) {
                await Row.findByIdAndDelete({ _id: rowToDelete._id });
            }
        }

    }

    try {
        for (const cell of cells || []) {
            await Cell.findByIdAndDelete({ _id: cell._id })
        }
        const deletedRow = await Row.findByIdAndDelete({ _id: row?._id });

        if (deletedRow) {
            const columns = await Column.find({ dataCollection: dataCollection?._id })
            const allAssigneeIds = await getAllAssigneeIds(columns, row as IRow);
            handleEvent({
                actionBy: user as IUser,
                assignee: null,
                workspace: workspace?._id as string,
                dataCollection: dataCollection?._id as string,
                type: 'data',
                priority: 100,
                message: dataCollection?.primaryColumnName ? `Item "${row?.values[dataCollection?.primaryColumnName]}" in "${dataCollection?.name}" was deleted by ${user?.firstname} ${user?.lastname}.` : `An item was deleted in "${dataCollection?.name}" by ${user?.firstname} ${user?.lastname}.`,
                associatedUserIds: allAssigneeIds as string[]
            }, null, allAssigneeIds as string[])
        }
        io.emit("update views", { message: "" });
        res.send(row);
    } catch (error) {
        res.status(400).send({ success: false });
    }
}

export const deleteRows = async (req: Request, res: Response) => {
    try {
        for (const r of req.body) {
            const row = await Row.findOne({ _id: r._id });
            let cells: any = row?.cells;
            for (const cell of cells || []) {
                await Cell.findByIdAndDelete({ _id: cell._id })
            }
            await Row.findByIdAndDelete({ _id: row?._id });
        }

        res.send({ success: true });
    } catch (error) {
        res.status(400).send({ success: false });
    }
}

export const getBlankRows = async (req: Request, res: Response) => {
    try {
        const { dataCollectionId, numberOfRowsToCreate } = req.body;

        const dataCollection = await DataCollection.findOne({ _id: dataCollectionId });
        const totalNumberOfRows = await Row.count({ dataCollection: dataCollectionId });
        const user = await User.findOne({ _id: (<any>req).user._id });

        const blankRows = await addBlankRows(dataCollection, user, numberOfRowsToCreate, totalNumberOfRows);

        res.send(blankRows)
    } catch (error) {
        res.status(400).send({ success: false })
    }
}

export const migrateRows = async (req: Request, res: Response) => {
    try {
        const rows = await Row.find({});

        for (const row of rows) {
            const dataCollection = await DataCollection.findOne({ _id: row?.dataCollection });
            const workspace = await Workspace.findOne({ _id: dataCollection?.workspace });
            const members = workspace?.members;
            let newNotes = []
            const thisRow = await Row.findOne({ _id: row._id });
            for (const note of row.notesList) {
                note.people = members || [];
                newNotes.push(note)
            }
            if (thisRow) {
                thisRow.notesList = newNotes;
            }
            thisRow?.save();

        }
        res.send({ success: true })
    } catch (error) {
        res.status(400).send({ success: false })
    }
}

export const acknowledgeRow = async (req: Request, res: Response) => {
    try {
        const row = await Row.findOne({ _id: req.params.rowId });
        const dataCollection = await DataCollection.findOne({ _id: row?.dataCollection })
        const workspace = await Workspace.findOne({ _id: dataCollection?.workspace });
        const acknowledger = await User.findOne({ _id: (<any>req).user._id });
        const creator = await User.findOne({ _id: row?.createdBy });

        io.emit(creator?._id || "", { message: `${acknowledger?.firstname} ${acknowledger?.lastname} has acknowledged ${dataCollection?.name[0].toUpperCase()}${dataCollection?.name.slice(1)} Data Collection assignment.` });
        io.emit("update row", { message: "" });
        const notification = new Notification({
            message: `${acknowledger?.firstname} ${acknowledger?.lastname} has acknowledged ${dataCollection?.name[0].toUpperCase()}${dataCollection?.name.slice(1)} Data Collection assignment.`,
            workspaceId: workspace?._id,
            assignedTo: acknowledger?._id,
            dataSource: "",
            priority: "Low",
            read: false,
        })
        notification.save();

        sendEmail({
            email: creator?.email || "",
            subject: `Collabtime Acknowledment - ${workspace?.name}`,
            payload: {
                message: `${workspace?.name} - ${dataCollection?.name} assignment has been acknowledged by ${acknowledger?.firstname} ${acknowledger?.lastname}`,
                link: `${process.env.CLIENT_URL || "http://localhost:5173"}/workspaces/${workspace?._id}/dataCollections/${dataCollection?._id}`,
                dataCollectionName: dataCollection?.name
            },
            template: "./template/rowAcknowledgement.handlebars"
        }, () => {

        })

        if (row) row.acknowledged = true;

        row?.save();

        io.emit("update row", { message: "" });

        res.send({ success: true });
    } catch (error) {
        res.status(400).send({ success: true });
    }
}

export const reorderRows = async (req: Request, res: Response) => {
    try {
        const { draggedRowPosition, overRowPosition, numberOfItems } = req.body;
        const { dataCollectionId } = req.params;

        const movedRow = await Row.find({ dataCollection: dataCollectionId, position: draggedRowPosition + 1 });

        for (const row of movedRow) {
            row.position = 0;
            const r = await Row.findByIdAndUpdate(row._id, row, { new: true });
        }

        if (draggedRowPosition > overRowPosition) {
            const rowsToIncrement = await Row.find({ dataCollection: dataCollectionId, $and: [{ position: { $gte: overRowPosition + 1 } }, { position: { $lt: draggedRowPosition + 1 } }] });

            for (const row of rowsToIncrement) {
                row.position = row.position + 1;
                const r = await Row.findByIdAndUpdate(row._id, row, { new: true });
            }


        } else {
            const rowsToDecrement = await Row.find({ dataCollection: dataCollectionId, $and: [{ position: { $lte: overRowPosition + 1 } }, { position: { $gt: draggedRowPosition + 1 } }] });

            for (const row of rowsToDecrement) {
                row.position = row.position - 1;
                const r = await Row.findByIdAndUpdate(row._id, row, { new: true });
            }
        }

        for (const row of movedRow) {
            row.position = overRowPosition + 1;
            const r = await Row.findByIdAndUpdate(row._id, row, { new: true });
        }


        res.send({ success: true })
    } catch (err) {
        res.status(400).send({ success: false })
    }
}


// TEMP FUNCTION
export const addReminder = async (req: Request, res: Response) => {
    try {
        const rows = await Row.find({});

        for (const row of rows) {

            const thisRow = await Row.findOne({ _id: row._id });
            if (thisRow) {
                thisRow.reminder = true;
            }
            thisRow?.save();
        }
        res.send({ success: true });
    } catch (error) {
        res.send({ success: false });
    }
}

export const getTotalRows = async (req: Request, res: Response) => {
    try {
        const dataCollection = await DataCollection.findOne({ _id: req.params.dataCollectionId });
        const rows = await Row.find({ dataCollection: dataCollection?._id });

        const numberOfPages = Math.ceil(rows?.length / Number(req.query.limit));

        const pages = []

        for (let i = 1; i <= numberOfPages; i++) {
            pages.push(i);
        }
        res.send(pages);
    } catch (error) {
        res.status(400).send({ success: false });
    }
}

export const getFormData = async (req: Request, res: Response) => {
    try {
        const { dataCollectionId } = req.params;
        const dataCollection = await DataCollection.findOne({ _id: dataCollectionId })
        const rows = await Row.find({ dataCollection: dataCollectionId }).sort({ position: 1 });
        const columns = await Column.find({ dataCollection: dataCollectionId });

        let emptyRow: any;

        for (const row of rows) {
            let isEmpty = true;
            for (const column of columns) {
                if (row.values[column.name] !== "") {
                    isEmpty = false;
                    break;
                }
            }

            if (isEmpty) {
                emptyRow = row;
                break;
            }
        }

        emptyRow.dataCollection = dataCollection;

        res.send({ columns, row: emptyRow, rows, dataCollection });


    } catch (error) {
        res.send({ success: false })
    }


}

export const updateFormData = async (req: Request, res: Response) => {
    try {
        const row = await Row.findOne({ _id: req.body._id });
        const columns = await Column.find({ dataCollection: row?.dataCollection });

        let isEmpty = true;

        for (const column of columns) {
            if (row?.values[column.name] !== "") {
                isEmpty = false;
                break;
            }
        }

        if (!isEmpty) {
            const rows = await Row.find({ dataCollection: row?.dataCollection });

            let emptyRow: any;

            for (const row of rows) {
                let isEmpty = true;
                for (const column of columns) {
                    if (row.values[column.name] !== "") {
                        isEmpty = false;
                        break;
                    }
                }

                if (isEmpty) {
                    req.body._id = row._id;
                    break;
                }
            }
        }
        const newRow = await Row.findByIdAndUpdate(req.body._id, { $set: { values: req.body.values, refs: req.body.refs } }, { new: true });
        res.send(newRow);

    } catch (error) {
        res.send({ success: false })
    }
}

export const deleteValues = async (req: Request, res: Response) => {
    const { dataCollectionId } = req.params;
    const column = req.body;

    const rows = await Row.find({ dataCollection: dataCollectionId });

    for (const row of rows) {
        const values = row.values;
        delete values[column.name];

        const newRow = { ...row, values };

        await Row.findByIdAndUpdate(row._id, { values: newRow.values }, { new: true });
    }

    res.send({ success: true });
}

export const callUpdate = async (req: Request, res: Response) => {
    res.send({ success: true });
}