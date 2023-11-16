import { Request, Response } from "express";
import DataCollection from "../models/dataCollection.model";
import Column from "../models/column.model";
import Row from "../models/row.models";
import Cell from "../models/cell.models";

export const getColumns = async (req: Request, res: Response) => {
    const dataCollection = await DataCollection.findOne({_id: req.params.dataCollectionId});
    const columns = await Column.find({dataCollection: dataCollection?._id});

    try {
        res.send(columns);
    } catch (error) {
        res.status(400).send({success: false});
    }
}

export const createColumn = async (req: Request, res: Response) => {
    const dataCollection = await DataCollection.findOne({_id: req.params.dataCollectionId});
    const rows = await Row.find({dataCollection: dataCollection?._id});
    const column = new Column({...(req.body), dataCollection: dataCollection?._id});

    for (const row of rows) {
        const cell = new Cell({
            dataCollection: column.dataCollection,
            row: row._id,
            name: column.name,
            type: column.type,
            labels: column.labels,
            value: (column.labels || [])[0].title
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
        const column = await Column.findByIdAndUpdate(req.params.id, req.body);
        res.send(column);
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
            await Cell.findByIdAndDelete({_id: cell._id});
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
            row.cells = result;
            result = [];
            await Row.findByIdAndUpdate({_id: row._id}, row);
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