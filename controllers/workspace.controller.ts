import { Request, Response } from "express"
import Workspace from "../models/workspace.model"
import User from "../models/auth.model"
import { IUser } from "../services/auth.service"

export const getWorkspaces = async (req: Request, res: Response) => {
    const user = await User.findOne({_id: (<any>req).user._id});
    const data = [];
    if (user) {
        try {
            for (const workspaceId of user.workspaces) {
                const workspace = await Workspace.findOne({_id: workspaceId});
                data.push(workspace);
            }
            res.status(200).send(data);
        } catch (err) {
            res.status(400).send({success: false});
        }
        
    } else {
        res.send({success: false});
    }
}

export const createWorkspace = async (req: Request, res: Response) => {
    const user = await User.findOne({_id: (<any>req).user._id});

    if ((<any>req).user) {
        const workspace = new Workspace({...(req.body), owner: (<any>req).user._id});
        console.log(workspace)
    
        try {
            if (user) {
                await workspace.save();
                const userWorkspaces = user.workspaces;
                userWorkspaces.push(workspace._id);
                await User.updateOne({_id: (<any>req).user}, {$set: {workspaces: userWorkspaces}});
                res.send(workspace);
            } else {
                res.status(400).send({success: false});
            }
            
        } catch (error) {
            res.status(500).send(error);
        }
    }
    
}

export const getOneWorkspace = async (req: Request, res: Response) => {
    const workspace = await Workspace.findById(req.params.id);

    try {
        res.send(workspace);
    } catch (error) {
        res.status(400).send(error);
    }
    
}

export const updateWorkspace = async (req: Request, res: Response) => {
    try {
        const workspace = await Workspace.findByIdAndUpdate(req.params.id, req.body);
        res.send(workspace);
    } catch (error) {
        res.status(400).send(error);
    }
}

export const deleteWorkspace = async (req: Request, res: Response) => {
    try {
        const workspace = await Workspace.findOneAndDelete({_id: req.params.id, owner: (<any>req).user._id});
        const user = await User.findOne({_id: (<any>req).user._id});
        const userWorkspaces = user?.workspaces.filter((item) => {
            return item !== workspace?.id;
        });
        console.log(userWorkspaces);
        await User.updateOne({_id: user?._id}, {$set: {workspaces: userWorkspaces}});
        
        res.send(workspace);
    } catch (error) {
        res.status(400).send(error);
    }
}