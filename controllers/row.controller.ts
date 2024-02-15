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
import { IRow } from "../services/row.service";

export const getRows = async (req: Request, res: Response) => {

    try {
        const sort = Number(req.query.sort) === 1 || req.query.sort === undefined ? 1 : -1;
        const skip = req.query.skip === undefined ? 0 : Number(req.query.skip);
        const limit = req.query.limit === undefined ? 0 : Number(req.query.limit);

        const sortBy: string = (req.query.sortBy === "createdAt" || req.query.sortBy === undefined ? "createdAt" : `values.${req.query.sortBy}`) as string;

        const dataCollection = await DataCollection.findOne({ _id: req.params.dataCollectionId });

        const rows = await Row.find({ dataCollection: dataCollection?._id }).sort({ position: sort }).skip(skip).limit(limit);
        // const result = [];

        // for (const row of rows) {
        //     const rowCopy: any = row;
        //     let cells = await Cell.find({ row: row._id }).sort("position")
        //     rowCopy.cells = cells;
        //     result.push(rowCopy)
        // }

        // console.log("RESULT", result)

        res.send(rows);

    } catch (error) {
        console.log(error)
        res.status(400).send({ success: false })
    }
}

// export const createRow = async (req: Request, res: Response) => {
//     const dataCollection = await DataCollection.findOne({ _id: req.params.dataCollectionId });
//     const columns = await Column.find({ dataCollection: dataCollection?._id });
//     // body is a row
//     const body = req.body;
//     let value;
//     let docs = [];
//     let links = [];

//     const workspace = await Workspace.findOne({ _id: req.params.workspaceId });

//     // This will hold the members of the workspace to include in the cell
//     const people: any = [];

//     for (const member of workspace?.members || []) {
//         let person = await User.findOne({ email: member.email });
//         people.push(person);
//     }

//     const defaultPerson = await User.findOne({ _id: (<any>req).user._id });
//     console.log(defaultPerson);

//     // create a new row with the associated data collection id
//     const row = new Row({ dataCollection: dataCollection?._id })
//     // add the assignedTo key to the creator of the row.
//     const creator = (<any>req).user._id;
//     row.createdBy = creator;
//     row.assignedTo = (<any>req).user._id

//     const newCells: any = [];

//     // Go through all the columns to create cells for the row
//     for (const column of columns) {
//         // If the column is a people type then get the user selected by the creator of the row
//         // and assign the first and last name to the value
//         // Notify by sockets update and by email that user that an assignment has been issued
//         if (column.type == "people") {
//             console.log("USERID", body[column.name])
//             const user = await User.findOne({ _id: body[column.name] || defaultPerson?._id });
//             console.log("USER", user);
//             row.assignedTo = user?._id || "";
//             value = `${user?.firstname} ${user?.lastname}`;


//             io.emit(user?._id || "", { message: "You have been assigned to a data collection task." })

//             // needs email ****************************
//             const link = `${process.env.CLIENT_URL || "http://localhost:5173"}/workspaces/${workspace?._id}/dataCollections/${dataCollection?._id}?acknowledgedRow=${row?._id}`;
//             sendEmail({
//                 email: user?.email || "",
//                 subject: `New Assignment in ${workspace?.name} - ${dataCollection?.name}`,
//                 payload: {
//                     message: `Hi ${user?.firstname}, you have been assigned a ${dataCollection?.name} task.`,
//                     link: link,
//                     dataCollectionName: dataCollection?.name,
//                 },
//                 template: "./template/dataCollectionStatusChange.handlebars",
//                 res,
//             }, (res: Response) => console.log("Email sent."));


//             // cron.schedule("0 6 * * * 1,2,3,4,5", () => {
//             //     sendEmail({
//             //         email: user?.email || "", 
//             //         subject: `Reminder - Assignment in ${workspace?.name} - ${dataCollection?.name}`, 
//             //         payload: {
//             //             message: `Hi ${user?.firstname}, you have been assigned a ${dataCollection?.name} task.`, 
//             //             link: link,
//             //             dataCollectionName: dataCollection?.name,
//             //         }, 
//             //         template: "./template/dataCollectionStatusChange.handlebars", 
//             //         res,
//             //     }, (res: Response) => console.log("Email sent."));
//             // }, {name: row._id})

//             // console.log("CRON TASKS", cron.getTasks().get(row._id));

//             // Else if the type is date, then handle the input accordingly and assign it value
//         } else if (column.type === "date") {
//             console.log("DATE", body[column.name])
//             if (body[column.name] === undefined) {
//                 value = (new Date(body[column.name]));
//             } else {
//                 value = body[column.name];
//             }

//         } else if (column.type === "priority") {
//             if (body[column.name] === "Critical") {
//                 row.acknowledged = false;
//             }

//             value = body[column.name];

//         } else if (column.type === "upload") {
//             console.log("UPLOAD BODY ***********************", body.docs);
//             // let count = 0;
//             // for (const upload of body[column.name]) {
//             //     count++
//             // }
//             value = ""
//             docs = body[column.name];
//         } else if (column.type === "link") {
//             value = ""
//             links = body.links;
//             // otherwise the value just equals the request body based on the column name
//         } else {
//             value = body[column.name]
//         }

//         // create cell 
//         let cell = new Cell({
//             dataCollection: column.dataCollection,
//             row: row._id,
//             name: column.name,
//             type: column.type,
//             value: value,
//             labels: column.labels,
//             people: people,
//             docs: docs,
//             links: links,
//             position: column.position
//         });
//         cell.value = value;

//         // Add cell id to the rows list
//         row.cells.push(cell._id);


//         // Save the cell
//         try {
//             cell.save();

//             newCells.push(cell)
//         } catch (error) {
//             console.log("CELL ERROR", error)
//             res.status(400).send({ success: false })
//         }
//     }

//     // Save the row
//     try {
//         row.save();

//         row.cells = newCells;
//         res.send(row)
//     } catch (error) {
//         console.log("ROW ERROR", error)
//         res.status(400).send({ success: false })
//     }
// }

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

        console.log("ROW ERROR", error)
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

    // console.log({ email, priority })
    if (email !== "" && priority !== "") {
        if (priority === "Critical") {
            console.log({ email, priority })
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
        const row: any = await Row.findOne({ _id: req.params.id });
        const workspace = await Workspace.findOne({ _id: req.params.workspaceId });
        const dataCollection = await DataCollection.findOne({ _id: req.params.dataCollectionId })
        const noteCreator = await User.findOne({ _id: (<any>req).user._id });

        // console.log({ newRow: req.body, prevRow: row })

        if ((req.body.values["assigned_to"] !== row.values["assigned_to"]) || (req.body.values["priority"] !== row.values["priority"]) || (req.body.values["status"] !== row.values["status"])) {
            const email = req.body.values["assigned_to"].split(" - ")[1];


            console.log("Email is not blank, it is " + email)
            const user = await User.findOne({ email: email });
            io.emit(user?._id || "", { message: `New Assignment in ${workspace?.name} - ${dataCollection?.name}` });
            io.emit("update row", { message: "" });

            sendCriticalRowEmail(req.body);
        }

        // if there are more notes in the req body than in the db, then there is a new note
        // in which we want to notify the user and update the frontend via sockets
        if (row?.notesList.length !== req.body.notesList.length) {
            for (const member of workspace?.members || []) {
                const user = await User.findOne({ email: member.email })
                io.emit(user?._id || "", { message: `${noteCreator?.firstname} ${noteCreator?.lastname} has added a new note to ${dataCollection?.name[0].toUpperCase()}${dataCollection?.name.slice(1)} Data Collection` });
                io.emit("update row", { message: "" })
                const notification = new Notification({
                    message: `${noteCreator?.firstname} ${noteCreator?.lastname} has added a new note to ${dataCollection?.name[0].toUpperCase()}${dataCollection?.name.slice(1)} Data Collection`,
                    workspaceId: workspace?._id,
                    assignedTo: user?._id,
                    dataSource: "",
                    priority: "Low",
                    read: false,
                })
                notification.save();
            }
        }

        // if existing row has not been acknowledged but the row been sent has,
        // then send an email to the owner of the row
        if (row?.acknowledged === false && req.body.acknowledged === true) {
            const rowOwner = await User.findOne({ _id: row.createdBy })
            sendEmail({
                email: rowOwner?.email || "",
                subject: `Collabtime Acknowledment - ${workspace?.name}`,
                payload: {
                    message: `${workspace?.name} - ${dataCollection?.name} assignment has been acknowledged by ${noteCreator?.firstname} ${noteCreator?.lastname}`,
                    link: `${process.env.CLIENT_URL || "http://localhost:5173"}/workspaces/${workspace?._id}/dataCollections/${dataCollection?._id}`,
                    dataCollectionName: dataCollection?.name
                },
                template: "./template/rowAcknowledgement.handlebars"
            }, () => {
                console.log("Email sent");
            })
        }
        if (req.body.createdBy === null) {
            req.body.createdBy = noteCreator?._id
        }
        await Row.findByIdAndUpdate(req.params.id, req.body, { new: true });
        const isLastRow = await checkIfLastRow(row);

        let blankRows: any = [];

        if (isLastRow) {
            blankRows = await addBlankRows(row, dataCollection, noteCreator, 10);
        }

        res.send(blankRows)
    } catch (error) {
        console.log({ error })
        res.status(400).send({ success: false })
    }
}

export const deleteRow = async (req: Request, res: Response) => {
    const row = await Row.findOne({ _id: req.params.id })
    let cells: any = row?.cells;

    try {
        for (const cell of cells || []) {
            console.log(cell)
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
                console.log(cell)
                await Cell.findByIdAndDelete({ _id: cell._id })
            }
            await Row.findByIdAndDelete({ _id: row?._id });
        }

        res.send({ success: true });
    } catch (error) {
        res.status(400).send({ success: false });
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
        console.log({ draggedRowPosition, overRowPosition, numberOfItems })
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
        console.log(err)
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

        console.log("NUMBER OF PAGES", pages)
        res.send(pages);
    } catch (error) {
        res.status(400).send({ success: false });
    }
}

export const callUpdate = async (req: Request, res: Response) => {
    res.send({ success: true });
}