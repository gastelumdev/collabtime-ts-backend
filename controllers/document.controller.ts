import { Request, Response } from "express";
import Document from "../models/document.model";
import Workspace from "../models/workspace.model";
import User from "../models/auth.model";
import { Schema } from "mongoose";
import { IUser } from "../services/auth.service";
import path from "path";
import fs from "fs";

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
        const user = await User.findOne({_id: (<any>req).user._id});
        const document = new Document(req.body);
        document.createdBy = user;
        document.save()

        res.send(document);
    } catch (error) {
        console.log(error)
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

export const deleteDocument = async (req: Request, res: Response) => {
    try {
        if (req.body.file) {
            fs.unlinkSync(process.env.ROOT_DIR + req.body.file.filename)
            fs.unlinkSync(process.env.PERSISTED_ROOT_DIR + req.body.file.filename)
        }
        
        const document = await Document.findByIdAndDelete(req.body._id);
        res.send(document)
    } catch (error) {
        console.log(error)
        res.status(400).send({success: false})
    }
}