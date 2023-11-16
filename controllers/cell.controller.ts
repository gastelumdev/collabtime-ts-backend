import { Request, Response } from "express";
import Cell from "../models/cell.models";

export const updateCell = async (req: Request, res: Response) => {
    try {
        const cell = await Cell.findByIdAndUpdate(req.params.id, req.body);
        console.log("CELL REQUEST BODY", req.body)
        res.send(cell);
    } catch (error) {
        res.status(400).send({success: false})
    }
}