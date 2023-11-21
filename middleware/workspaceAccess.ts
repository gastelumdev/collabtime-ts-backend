import { NextFunction, Request, Response } from "express";
import Workspace from "../models/workspace.model";

const verifyWorkspace = async (req: Request, res: Response, next: NextFunction) => {
    console.log("VERIFY WORKSPACE", (<any>req).params.id)
    try {
        const user = (<any>req).user;
        const workspace = await Workspace.findOne({_id: (<any>req).params.id});

        console.log("VERIFY WORKSPACE", workspace)

        let allowAccess = false;

        for (const userWorkspace of user.workspaces) {
            if (workspace?._id.equals(userWorkspace.id)) {
                allowAccess = true;
            }
        }

        if (allowAccess) next()
        else throw new Error("Cannot access workspace")
    } catch (error) {
        console.log("ERROR", error)
        res.status(400).send({success: false})
    }
}

export default verifyWorkspace;