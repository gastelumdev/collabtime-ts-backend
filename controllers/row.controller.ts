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
import { IRow, handleAcknowledgedRow, handleAssignedTo, handleCompletedRow, handleLastRowUpdate, handleNewNote, handleRowEmptiness, rowIsEmpty, updateRefs } from "../services/row.service";
import { IWorkspace } from "../services/workspace.service";
import UserGroup from "../models/userGroup.model";

export const getRows = async (req: Request, res: Response) => {

    try {
        const user = await User.findOne({ _id: (<any>req).user._id });
        // console.log(user)
        const sort = Number(req.query.sort) === 1 || req.query.sort === undefined ? 1 : -1;
        const skip = req.query.skip === undefined ? 0 : Number(req.query.skip);
        const limit = req.query.limit === undefined ? 0 : Number(req.query.limit);
        const showEmptyRows = req.query.showEmptyRows !== undefined ? req.query.showEmptyRows === 'false' ? false : true : true;
        // console.log({ filters: req.query.filters })


        const sortBy: string = (req.query.sortBy === "createdAt" || req.query.sortBy === undefined ? "createdAt" : `values.${req.query.sortBy}`) as string;

        const dataCollection = await DataCollection.findOne({ _id: req.params.dataCollectionId });

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
        // console.log("Filters and usergroups are set")

        // const filters = req.query.filters !== 'undefined' ? JSON.parse(req.query.filters as string) : appModel && appModel.filters && appModel.filters !== undefined ? JSON.parse(appModel.filters) : {};

        // console.log({ filters })
        let rows;

        if (showEmptyRows) {
            rows = await Row.find({ dataCollection: dataCollection?._id }).sort({ position: sort }).skip(skip).limit(limit);
        } else {
            rows = await Row.find({ dataCollection: dataCollection?._id, isEmpty: false }).sort({ position: sort }).skip(skip).limit(limit);
        }

        // console.log(`These filters are for ${dataCollection?.name}`)
        // console.log({ filters })

        for (const filter of Object.keys(filters)) {
            const filterVals = filters[filter]



            // console.log(``)
            // console.log(`The values that we are looking to filter using key ${filter} by for the ${dataCollection?.name} view.`)
            // console.log(filterVals)
            // console.log(``)

            // console.log(``)
            // console.log(`There are ${rows.length} rows to go through.`)
            // console.log(``)

            rows = rows.filter((row: any) => {
                const refs = row.refs[filter];

                // console.log({ userGroupAccess: appModel?.userGroupAccess, userGroupName });
                if (appModel?.userGroupAccess?.includes(userGroupName)) {
                    return true;
                }

                // console.log(``)
                // console.log(`The refs for the ${row.values['Todo']} row.`)
                // console.log(row.refs)
                // console.log(``)

                let existsInRef = false;
                const lowerCaseValues = filterVals.map((item: string) => {
                    return item.toLowerCase()
                })

                if (refs !== undefined && refs.length > 0) {
                    // console.log("");
                    // console.log("Is going to go through refs.")
                    // console.log("")

                    for (const ref of refs) {
                        if (lowerCaseValues.includes(ref.values["item_name"].toLowerCase())) {
                            existsInRef = true;
                            return true
                        }

                    }
                } else {
                    // console.log("");
                    // console.log("It is not going to go through refs.")
                    // console.log("The type of row values is " + typeof row.values[filter])
                    // console.log({ lowerCaseValues })
                    // console.log("")
                    let isMatch = false;
                    if (typeof row.values[filter] !== 'string') {
                        // console.log("")
                        // console.log("This is not a string value. Potential people array...")
                        // console.log(row.values[filter])

                        // console.log("")


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

                // console.log({ condition: lowerCaseValues.includes(row.values[filter].toLowerCase()) || existsInRef })


            })
        }

        // console.log("SENDING ROWS")

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
            }, (res: Response) => console.log("Email sent."));

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
                // console.log({ dataCollection })
                if (row?.isEmpty) {

                    for (const dc of subDataCollections) {
                        const newRow = new Row({
                            dataCollection: dc._id,
                            values: req.body.values,
                            position: row?.position,
                            isEmpty: false
                        })
                        newRow.save()
                        // console.log({ newRow })

                        // console.log({ requestBody: req.body, newRow })
                    }
                } else {
                    for (const dc of subDataCollections) {
                        const existingRow = await Row.findOne({ position: req.body.position, dataCollection: dc._id });
                        // console.log({ requestBody: req.body, existingRow })
                        const primaryColumn = await Column.findOne({ dataCollection: dc.appModel, primary: true });
                        // console.log({ primaryColumn })
                        // const updatedRow = await Row.findByIdAndUpdate(existingRow?._id, { ...existingRow?.toObject(), values: { ...existingRow?.values, [primaryColumn?.name as string]: req.body.values[primaryColumn?.name as any] } });
                        const updatedRow = await Row.findByIdAndUpdate(existingRow?._id, { ...existingRow?.toObject(), values: req.body.values });
                        // console.log({ updatedRow });

                    }
                }
            }
        } else {
            dataCollection = await DataCollection.findOne({ _id: dataCollection?.appModel })
        }

        // Set the first user to interact with the row as the creator
        if (req.body.createdBy === null) req.body.createdBy = assigner?._id;

        // Update the row
        await Row.findByIdAndUpdate(req.params.id, req.body, { new: true });
        // Updates references in all rows across all data collections in a workspace if a specific column value changes.
        updateRefs(workspace, dataCollection, row, req.body);
        // Handles changes to the "assigned_to" field of a row, sending notifications and emails if the assigned user changes.
        handleAssignedTo(workspace, dataCollection, row, req.body, assigner);
        // Handles the addition of a new note to a row, sending notifications and updating the frontend if the notes list changes.
        handleNewNote(workspace, dataCollection, row, req.body, assigner);
        // Handles the acknowledgment of a row, sending an email notification to the row's creator if the row is acknowledged.
        handleAcknowledgedRow(workspace, dataCollection, row, req.body, assigner)
        // Handles the completion status of a row and its child rows based on the "status" field.
        handleCompletedRow(row, req.body)
        // Sets row to empty/non-empty based on its values
        handleRowEmptiness(req.body);

        // Handles the update of the last row in a data collection, adding blank rows if necessary.
        const blankRows = await handleLastRowUpdate(dataCollection, row, req.body, assigner);

        // if (req.body.fromView) {
        // console.log("This is being updated from a view")
        io.emit("update views", { message: "" });
        // }
        // io.emit(workspace?._id, { message: `Update data collection` });
        // console.log({ blankRows })
        // Send the blank rows for the frontend to have
        res.send(blankRows);
    } catch (error) {
        res.status(400).send({ success: false })
    }
}

export const deleteRow = async (req: Request, res: Response) => {
    const row = await Row.findOne({ _id: req.params.id })
    let cells: any = row?.cells;

    const dataCollection = await DataCollection.findOne({ _id: row?._id });

    if (dataCollection?.appModel && !dataCollection.main) {
        const subDataCollections = await DataCollection.find({ appModel: dataCollection._id })

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
        await Row.findByIdAndDelete({ _id: row?._id });
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
    // console.log(req.body)
    try {
        const { dataCollectionId, numberOfRowsToCreate } = req.body;

        // console.log({ params: req.params })

        const dataCollection = await DataCollection.findOne({ _id: dataCollectionId });
        const totalNumberOfRows = await Row.count({ dataCollection: dataCollectionId });
        const user = await User.findOne({ _id: (<any>req).user._id });
        // const numberOfRowsToCreate = req.body.numberOfRowsToCreate;


        const blankRows = await addBlankRows(dataCollection, user, numberOfRowsToCreate, totalNumberOfRows);

        res.send(blankRows)
    } catch (error) {
        res.status(400).send({ success: false })
    }
}

export const migrateRows = async (req: Request, res: Response) => {
    try {
        const rows = await Row.find({});

        // for (const row of rows) {
        //     if (row?.notes != "") {
        //         row.notesList.push({content: row?.notes, owner: "Carlos Torres", createdAt: (new Date()).toISOString(), read: false})
        //     }
        //     await Row.findByIdAndUpdate(row._id, row);
        // }



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
            console.log("Email sent");
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
        // console.log({ draggedRowPosition, overRowPosition, numberOfItems })
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