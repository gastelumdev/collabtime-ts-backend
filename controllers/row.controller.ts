import { Request, Response } from "express";
import DataCollection from "../models/dataCollection.model"
import Column from "../models/column.model";
import Row from "../models/row.models";
import Cell from "../models/cell.models";
import { ICell } from "../services/cell.service";
import { TCell } from "../types";

export const getRows = async (req: Request, res: Response) => {
    const dataCollection = await DataCollection.findOne({_id: req.params.dataCollectionId});
    const rows = await Row.find({dataCollection: dataCollection?._id});
    const columns = await Column.find({dataCollection: dataCollection?._id})

    // console.log("DATA COLLECTION", dataCollection);
    // console.log("ROWS", rows);

    let cells: any[] = [];
    const result = [];

    for (const row of rows) {
        console.log("ROW", row)
        for (const i in columns) {
            
            console.log("COLUMN",columns[i]);
            console.log("CELLID", row.cells[i])
            const cell = await Cell.findOne({_id: row.cells[i]});
            if (columns[i].name == cell?.name) {
                
                console.log("CELL", cell);
                cells.push(cell);
            } else {
                cells.push({})
            }
            
        }

        console.log("CELLS", cells);

        row.cells = cells;
        cells = []
        
        result.push(row);
    }

    console.log("RESULT", result);

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

    const row = new Row({dataCollection: dataCollection?._id});
    console.log(body);
    console.log(columns)

    for (const column of columns) {
        let cell = new Cell({row: row._id, name: column.name, type: column.type, value: body[column.name]});
        row.cells.push(cell._id);
        try {
            cell.save();
            console.log(cell);
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