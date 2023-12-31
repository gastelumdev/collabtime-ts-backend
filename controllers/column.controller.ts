import { Request, Response } from "express";
import DataCollection from "../models/dataCollection.model";
import Column from "../models/column.model";
import Row from "../models/row.models";
import Cell from "../models/cell.models";
import Workspace from "../models/workspace.model";
import User from "../models/auth.model";
import { io } from "../index";

export const getColumns = async (req: Request, res: Response) => {
    const dataCollection = await DataCollection.findOne({_id: req.params.dataCollectionId});
    const columns = await Column.find({dataCollection: dataCollection?._id}).sort("position");

    console.log(columns)

    try {
        res.send(columns);
    } catch (error) {
        res.status(400).send({success: false});
    }
}

export const createColumn = async (req: Request, res: Response) => {
    const dataCollection = await DataCollection.findOne({_id: req.params.dataCollectionId});
    const rows = await Row.find({dataCollection: dataCollection?._id});
    const columns = await Column.find({dataCollection: dataCollection?._id});
    const columnsLength = columns.length;

    for (const column of columns) {
        if (column.name == req.body.name) {
            io.emit("update", {message: "Column already exists."})
            res.status(400).send({success: false})
        }
    }

    const workspace = await Workspace.findOne({_id: req.params.workspaceId});

    const people: any = [];

    for (const member of workspace?.members || []) {
        let person = await User.findOne({email: member.email});
        people.push(person);
    }
    
    const column = new Column({...(req.body), dataCollection: dataCollection?._id, people: people});
    column.position = columnsLength + 1;
    let value;

    if (column.type === "text") value = "";
    if (column.type === "label" || column.type === "priority") value = (column.labels || [])[0].title;
    if (column.type === "people") value = "Select person";
    if (column.type === "date") value = (new Date()).toISOString()

    for (const row of rows) {
        const cell = new Cell({
            dataCollection: column.dataCollection,
            row: row._id,
            name: column.name,
            type: column.type,
            position: column.position,
            labels: column.labels,
            people: people,
            value: value
        });

        row.cells.push(cell._id);

        try {
            cell.save()
            await Row.findByIdAndUpdate({_id: row._id}, row);

        } catch (error) {
            res.status(400).send({success: false});
        }
    }

    try {
        
        
        column.save()
        res.send(column);
    } catch (error) {
        res.status(400).send({success: false});
    }
}

export const updateColumn = async (req: Request, res: Response) => {
    try {
        const column = await Column.findOne({_id: req.params.id});
        const dataCollection = await DataCollection.findOne({_id: req.params.dataCollectionId});
        const cells = await Cell.find({dataCollection: dataCollection?._id, name: column?.name})

        for (const cell of cells) {
            cell.name = req.body.name;
            cell.labels = req.body.labels;
            cell.save();
        }
        
        const newColumn = await Column.findByIdAndUpdate(req.params.id, req.body);
        res.send(newColumn);
    } catch (error) {
        res.status(400).send({success: false})
    }
}

export const deleteColumn = async (req: Request, res: Response) => {
    const column = await Column.findOne({_id: req?.params.id});
    const name = column?.name;
    const dataCollection = column?.dataCollection;

    const cellsInThisColumn = await Cell.find({name: name, dataCollection: dataCollection});
    const rows = await Row.find({dataCollection: dataCollection});

    console.log("CELLS IN COLUMN", cellsInThisColumn)

    let result = [];
    let cellIds = [];

    try {
        for (const cell of cellsInThisColumn) {
            await Cell.findByIdAndDelete({_id: cell._id})
            cellIds.push(cell._id);
        }
            
        console.log(cellIds)

        for (const row of rows) {

            // console.log("ROW CELLS", row.cells );

            for (const rowCell of row.cells) {
                let isInArray = false;
                for (const cellId of cellIds) {
                    if (cellId.equals(rowCell)) {
                        isInArray = true;
                    }
                }
                if (!isInArray) result.push(rowCell);
            }

            console.log("RESULT", result)
            const rowCopy: any = row;
            rowCopy.cells = result;
            result = [];
            await Row.findByIdAndUpdate({_id: rowCopy._id}, rowCopy);
        }
    } catch (error) {
        res.status(400).send({success: false})
    }
    

    try {
        await Column.findByIdAndDelete({_id: req?.params.id});
        res.send({success: true});
    } catch (error) {
        res.status(400).send({success: false});
    }
}