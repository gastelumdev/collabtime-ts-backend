import { Request, Response } from "express";
import Workspace from "../models/workspace.model";
import DataCollection from "../models/dataCollection.model";
import Document from "../models/document.model";
import User from "../models/auth.model";
import { IWorkspace } from "../services/workspace.service";

export const searchAll = async (req: Request, res: Response) => {
    try {
        const key = req.body.key;
        const user = await User.findOne({_id: (<any>req).user._id});
        const workspaceIds: string[] = [];
        const workspaces: IWorkspace[] = []

        for (const userWorkspace of user?.workspaces || []) {
            workspaceIds.push(userWorkspace.id);
        }

        for (const workspaceId of workspaceIds) {
            let workspace: any = await Workspace.findOne({_id: workspaceId, $or:[{name: key !== "" ? new RegExp(`^${key}`, 'i')  : ""}]});
            if (workspace) workspaces.push(workspace);
        }

        const dataCollections = await DataCollection.find({$or:[{name: key !== "" ? new RegExp(`^${key}`, 'i')  : ""}], workspace: workspaceIds});
        // const dataCollections = await DataCollection.find({name: new RegExp(`^${key}`, 'i'), workspace: workspaceIds});
        
        const docs = await Document.find({$or: [{filename: key !== "" ? new RegExp(`^${key}`, 'i')  : ""}], workspace: workspaceIds});

        console.log(workspaces)
        console.log("DATA COLLECTIONS", dataCollections)

        res.send({workspaces, dataCollections, docs});
    } catch (error) {
        console.log(error);
        res.status(400).send({success: false})
    }
    


}