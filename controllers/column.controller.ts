import { Request, Response } from "express";
import DataCollection from "../models/dataCollection.model";
import Column from "../models/column.model";
import Row from "../models/row.models";
import Cell from "../models/cell.models";
import Workspace from "../models/workspace.model";
import User from "../models/auth.model";
import { io } from "../socketServer";

export const getColumns = async (req: Request, res: Response) => {
    const dataCollection = await DataCollection.findOne({ _id: req.params.dataCollectionId });
    const columns = await Column.find({ dataCollection: dataCollection?._id }).sort("position");

    try {
        res.send(columns);
    } catch (error) {
        res.status(400).send({ success: false });
    }
}

export const createColumn = async (req: Request, res: Response) => {
    console.log({ body: req.body })

    try {
        const dataCollection = await DataCollection.findOne({ _id: req.params.dataCollectionId });
        const rows = await Row.find({ dataCollection: dataCollection?._id });
        const columns = await Column.find({ dataCollection: dataCollection?._id });
        const columnsLength = columns.length;



        for (const column of columns) {
            if (column.name == req.body.name) {
                io.emit("update", { message: "Column already exists." })
                res.status(400).send({ success: false })
            }
        }

        const workspace = await Workspace.findOne({ _id: req.params.workspaceId })

        const people: any = []

        for (const member of workspace?.members || []) {
            let person = await User.findOne({ email: member.email });
            people.push(person);
        }

        const column = new Column({ ...(req.body), dataCollection: dataCollection?._id, people: people });
        column.position = columnsLength + 1
        let value

        if (column.type === "text") value = ""
        if (column.type === "label" || column.type === "priority") value = (column.labels || [])[0].title;
        if (column.type === "people") value = "Select person";
        if (column.type === "date") value = (new Date()).toISOString();
        if (column.type === "reference") {
            const dataCollectionRef = await DataCollection.findOne({ _id: req.body.dataCollectionRef });
            column.dataCollectionRef = dataCollectionRef
        }

        console.log(column)
        column.save()

        for (const row of rows) {
            row.values = { ...row.values, [column.name]: "" }
            console.log(row.values)
            // const cell = new Cell({
            //     dataCollection: column.dataCollection,
            //     row: row._id,
            //     name: column.name,
            //     type: column.type,
            //     position: column.position,
            //     labels: column.labels,
            //     people: people,
            //     value: value
            // });

            // row.cells.push(cell._id);

            try {
                // cell.save()
                await Row.findByIdAndUpdate({ _id: row._id }, row);

            } catch (error) {
                // console.log(error)
                res.status(400).send({ success: false });
            }
        }


        res.send(column);
    } catch (error) {
        // console.log(error)
        res.status(400).send({ success: false })
    }
}

export const updateColumn = async (req: Request, res: Response) => {
    try {
        // const column = await Column.findOne({ _id: req.params.id });
        // const dataCollection = await DataCollection.findOne({ _id: req.params.dataCollectionId });
        // const cells = await Cell.find({ dataCollection: dataCollection?._id, name: column?.name })

        // console.log({ width: req.body.width, position: req.body.position });

        // for (const cell of cells) {
        //     cell.name = req.body.name;
        //     cell.labels = req.body.labels;
        //     cell.save();
        // }

        const newColumn = await Column.findByIdAndUpdate(req.params.id, req.body, { new: true });
        console.log({ newColumn })
        res.send(newColumn);
    } catch (error) {
        res.status(400).send({ success: false })
    }
}

export const deleteColumn = async (req: Request, res: Response) => {


    // console.log("CELLS IN COLUMN", cellsInThisColumn)

    // let result = [];
    // let cellIds = [];

    // try {
    //     for (const cell of cellsInThisColumn) {
    //         await Cell.findByIdAndDelete({ _id: cell._id })
    //         cellIds.push(cell._id);
    //     }

    //     console.log(cellIds)

    //     for (const row of rows) {

    //         // console.log("ROW CELLS", row.cells );

    //         for (const rowCell of row.cells) {
    //             let isInArray = false;
    //             for (const cellId of cellIds) {
    //                 if (cellId.equals(rowCell)) {
    //                     isInArray = true;
    //                 }
    //             }
    //             if (!isInArray) result.push(rowCell);
    //         }

    //         console.log("RESULT", result)
    //         const rowCopy: any = row;
    //         rowCopy.cells = result;
    //         result = [];
    //         await Row.findByIdAndUpdate({ _id: rowCopy._id }, rowCopy);
    //     }
    // } catch (error) {
    //     res.status(400).send({ success: false })
    // }


    try {


        const column = await Column.findOne({ name: req?.body.name, dataCollection: req.params.dataCollectionId });
        console.log({ column });
        const name: any = column?.name;
        const dataCollection = column?.dataCollection;
        const { dataCollectionId } = req.params;

        await Column.findByIdAndDelete(column?._id);

        // const cellsInThisColumn = await Cell.find({ name: name, dataCollection: dataCollection });
        const rows = await Row.find({ dataCollection: dataCollectionId });
        // console.log({ rows })

        for (const row of rows) {
            const rowCopy: any = await Row.findOne({ _id: row._id });
            // console.log({ name })
            let values = rowCopy.values;
            let refs = rowCopy.refs;
            console.log({ refs })
            delete values[name];
            delete refs[name];
            console.log({ refs })
            rowCopy.values = values;
            rowCopy.refs = refs;
            console.log({ rowCopyRefs: rowCopy.refs })


            // console.log(row.refs)
            const newRow = await Row.findByIdAndUpdate(row._id, { $set: { values: rowCopy.values, refs: rowCopy.refs } }, { new: true });
            console.log(newRow?.refs)
            // console.log({ values: newRow?.values, refs: newRow?.refs })
        }
        res.send({ success: true });
    } catch (error) {
        res.status(400).send({ success: false })
    }
}

export const reorderColumns = async (req: Request, res: Response) => {
    // const { dataCollectionId } = req.params;
    const columns = req.body;
    // console.log(columns)

    // const dataCollection = await DataCollection.findOne({ _id: dataCollectionId });

    try {
        for (let i = 1; i <= columns.length; i++) {
            const newColumn: any = await Column.findOne({ _id: columns[i - 1]._id });
            newColumn.position = i;
            console.log(newColumn.position)
            await newColumn?.save();
        }
        res.send({ success: true });
    }
    catch (error) {
        res.status(400).send({ success: false });
    }
}