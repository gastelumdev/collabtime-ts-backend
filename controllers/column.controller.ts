import { Request, Response } from "express";
import DataCollection from "../models/dataCollection.model";
import Column from "../models/column.model";
import Row from "../models/row.models";
import Cell from "../models/cell.models";
import Workspace from "../models/workspace.model";
import User from "../models/auth.model";
import { io } from "../index";
import { TLabel } from "../types";

export const getColumns = async (req: Request, res: Response) => {


    try {
        const dataCollection = await DataCollection.findOne({ _id: req.params.dataCollectionId });
        const columns = await Column.find({ dataCollection: dataCollection?._id }).sort("position");

        res.send(columns);
    } catch (error) {
        res.status(400).send({ success: false });
    }
}

export const getWorkspaceColumns = async (req: Request, res: Response) => {
    // const dataCollection = await DataCollection.findOne({ _id: req.params.dataCollectionId });
    // const workspace = await Workspace.findOne({ _id: dataCollection?.workspace });

    try {
        const dataCollections = await DataCollection.find({ workspace: req.params.workspaceId });

        const response = []

        for (const dc of dataCollections) {
            const columns = await Column.find({ dataCollection: dc._id });

            for (const col of columns) {
                response.push(col);
            }
        }
        res.send(response);
    } catch (error) {
        res.status(400).send({ success: false });
    }
}

export const createColumn = async (req: Request, res: Response) => {
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
        let value = null;

        if (column.type === "text") value = ""
        if (column.type === "label" || column.type === "priority" || column.type === 'status') {
            const label: any = column.labels?.find((item: TLabel) => {
                return item.default;
            });
            value = label.title;
        }
        if (column.type === "people") value = "Select person";
        if (column.type === "date") value = (new Date()).toISOString();
        if (column.type === "reference") {
            const dataCollectionRef = await DataCollection.findOne({ _id: req.body.dataCollectionRef });
            column.dataCollectionRef = dataCollectionRef
        }

        console.log({ value })

        for (const row of rows) {
            const values = { ...row.values, [column.name]: value };
            const updatedRow = await Row.findByIdAndUpdate(row._id, { values: values }, { new: true });
            console.log({ updatedRow })
        }

        column.save()


        res.send(column);
    } catch (error) {
        console.log({ error })
        res.status(400).send({ success: false })
    }
}

export const updateColumn = async (req: Request, res: Response) => {
    try {
        const prevColumn: any = await Column.findById(req.params.id);
        const newColumn: any = req.body;

        if (prevColumn.width === newColumn.width && prevColumn.name !== newColumn.name) {
            const rows = await Row.find({ dataCollection: prevColumn?.dataCollection });

            for (const row of rows) {
                const values = row.values;

                const value = values[prevColumn.name]
                if (value !== undefined) {
                    values[newColumn.name] = value;
                    delete values[prevColumn.name];

                    const updatedRow = await Row.findByIdAndUpdate(row._id, { ...row, values }, { new: true });
                }
            }
        }


        const updatedColumn = await Column.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.send(updatedColumn);
    } catch (error) {
        res.status(400).send({ success: false })
    }
}

export const deleteColumn = async (req: Request, res: Response) => {
    try {


        const column = await Column.findOne({ name: req?.body.name, dataCollection: req.params.dataCollectionId });
        const name: any = column?.name;
        const dataCollection = column?.dataCollection;
        const { dataCollectionId } = req.params;

        await Column.findByIdAndDelete(column?._id);

        const rows = await Row.find({ dataCollection: dataCollectionId });

        const rowsWithValues = rows.filter((row) => {
            return (row.values[name] !== undefined || row.refs[name] !== undefined) && (row.values[name] !== "");
        });

        for (const row of rowsWithValues) {
            // const rowCopy: any = await Row.findOne({ _id: row._id });
            const rowCopy: any = row;
            let values = rowCopy.values;
            let refs = rowCopy.refs;
            delete values[name];
            rowCopy.values = values;

            let newRefs = {};

            if (refs !== undefined) {
                const refsKeys = Object.keys(refs);

                for (const key of refsKeys) {
                    if (key !== column?.name) {
                        newRefs = { ...newRefs, [column?.name as any]: refs[column?.name as any] };
                    }
                }
            }
            rowCopy.refs = newRefs;
            await Row.findByIdAndUpdate(row._id, { $set: { values: rowCopy.values, refs: rowCopy.refs } }, { new: true });

        }

        const columns = await Column.find({ dataCollection: dataCollection }).sort({ position: 1 });
        let position = 1;

        for (const column of columns) {
            let newColumn = { ...column, position };

            const updatedColumn = await Column.findByIdAndUpdate(column._id, { position: newColumn.position });
            position = position + 1;
        }
        res.send({ success: true });
    } catch (error) {
        res.status(400).send({ success: false })
    }
}

export const reorderColumns = async (req: Request, res: Response) => {
    const columns = req.body;

    try {
        for (let i = 1; i <= columns.length; i++) {
            const newColumn: any = await Column.findOne({ _id: columns[i - 1]._id });
            newColumn.position = i;
            await newColumn?.save();
        }
        res.send({ success: true });
    }
    catch (error) {
        res.status(400).send({ success: false });
    }
}