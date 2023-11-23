import { Request, Response } from "express";
import DataCollection from "../models/dataCollection.model"
import Column from "../models/column.model";
import Row from "../models/row.models";
import Cell from "../models/cell.models";
import { ICell } from "../services/cell.service";
import { TCell, TUser } from "../types";
import Workspace from "../models/workspace.model";
import User from "../models/auth.model";
import { io } from "../index";

export const getRows = async (req: Request, res: Response) => {
    const dataCollection = await DataCollection.findOne({_id: req.params.dataCollectionId});
    const rows = await Row.find({dataCollection: dataCollection?._id});
    const columns = await Column.find({dataCollection: dataCollection?._id})

    // console.log("DATA COLLECTION", dataCollection);
    // console.log("ROWS", rows);

    let cells: any[] = [];
    const result = [];

    for (const row of rows) {
        for (const i in columns) {
            const cell = await Cell.findOne({_id: row.cells[i]});
            if (columns[i].name == cell?.name) {
                
                cells.push(cell);
            } else {
                cells.push({})
            }
            
        }

        row.cells = cells;
        cells = []
        
        result.push(row);
    }

    // console.log(totalCells)

    try {
        res.send(result);
    } catch (error) {
        res.status(400).send({success: false});
    }
}

export const createRow = async (req: Request, res: Response) => {
    const dataCollection = await DataCollection.findOne({_id: req.params.dataCollectionId});
    const columns = await Column.find({dataCollection: dataCollection?._id});
    const body = req.body;
    let value;

    const workspace = await Workspace.findOne({_id: req.params.workspaceId});

    const people: any = [];

    for (const member of workspace?.members || []) {
        let person = await User.findOne({email: member.email});
        people.push(person);
    }

    const row = new Row({dataCollection: dataCollection?._id});

    for (const column of columns) {
        if (column.type == "people") {
            const user = await User.findOne({_id: body[column.name]});
            console.log("USER", user);
            value = `${user?.firstname} ${user?.lastname}`;

            io.emit(user?._id || "", "You have been assigned to a data collection task.");
        } else {
            value = body[column.name];
        }
        let cell = new Cell({dataCollection: column.dataCollection, row: row._id, name: column.name, type: column.type, value: value, labels: column.labels, people: people});
        row.cells.push(cell._id);
        try {
            cell.save();
        } catch(error) {
            res.status(400).send({success:false});
        }
        
    }

    try {
        row.save();
        res.send({success: true})
    } catch (error) {
        res.status(400).send({success: false})
    }
}

export const deleteRow = async (req: Request, res: Response) => {
    const row = await Row.findOne({_id: req.params.id});

    try {
        for (const cellId of row?.cells || []) {
            await Cell.findByIdAndDelete({_id: cellId});
        }
        await Row.findByIdAndDelete({_id: row?._id});
        res.send(row);
    } catch (error) {
        res.status(400).send({success: false});
    }


}