import { Request, Response } from "express";
import Document from "../models/document.model";
import Workspace from "../models/workspace.model";

export const getDocuments = async (req: Request, res: Response) => {
    try {
        const workspace = await Workspace.findOne({_id: req.params.workspaceId});
        const documents = await Document.find({workspace: workspace?._id});

        res.send(documents);
    } catch (error) {
        res.status(400).send({success: false});
    }
}

export const createDocument = async (req: Request, res: Response) => {
    try {
        const workspace = await Workspace.findOne({_id: req.params.workspaceId});
        const document = new Document(req.body);
        document.save()

        res.send(document);
    } catch (error) {
        res.status(400).send({success: false});
    }
}

export const updateDocument = async (req: Request, res: Response) => {
    try {
        const document = await Document.findByIdAndUpdate(req.body._id, req.body);
        res.send(document);
    } catch (error) {
        res.status(400).send({success: false});
    }
}