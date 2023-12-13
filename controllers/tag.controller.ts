import { Request, Response } from "express";
import Tag from "../models/tag.model";
import Workspace from "../models/workspace.model";
import DataCollection from "../models/dataCollection.model";
import { IWorkspace } from "../services/workspace.service";

export const getTags = async (req: Request, res: Response) => {
    try {
        const tags = await Tag.find({workspace: req.params.workspaceId});
        res.send(tags)
    } catch (error) {
        res.status(400).send({success: false})
    }
}

export const createTag = async (req: Request, res: Response) => {
    try {
        const workspace = await Workspace.findOne({_id: req.params.workspaceId});

        const tag = new Tag({
            workspace: workspace?._id,
            name: req.body.tag.name
        });

        await tag.save();
        

        res.send(tag);
    } catch (error) {
        res.status(400).send({success: false});
    }
}

export const deleteTag = async (req: Request, res: Response) => {
    try {

        await Tag.findByIdAndDelete(req.body._id);
        
        res.send({success: true});
    } catch(error) {
        res.status(400).send({success: false});
    }
}