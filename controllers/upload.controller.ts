import { Request, Response } from "express";

export const upload = (req: Request, res: Response) => {
    console.log("UPLOAD", req.file);
    try {
        res.send({filename: req.file?.filename})
    } catch (error) {
        res.status(400).send({success: false})
    }
}