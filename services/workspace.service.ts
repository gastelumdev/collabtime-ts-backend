import { Document, Schema, Model } from "mongoose";
import { ITag } from "./tag.service";
import Workspace from "../models/workspace.model";
import { IUserWorkspace } from "./auth.service";

export type TAccess = {
    access: number;
};

export type TTools = {
    dataCollections: TAccess;
    taskLists: TAccess;
    docs: TAccess;
    messageBoard: TAccess;
};

export type TInvitee = {
    email: string;
    permissions: number;
};

export interface IWorkspace {
    name: string;
    description?: string;
    tools: TTools;
    invitees: TInvitee[];
    members: TInvitee[];
    owner: Schema.Types.ObjectId;
    workspaceTags: ITag[];
    tags: ITag[];
    createdAt: Date;
}

export interface IWorkspaceDocument extends IWorkspace, Document { }

export interface IWorkspaceModel extends Model<IWorkspaceDocument> {
    buildWorkspace(args: IWorkspace): IWorkspaceDocument;
}

export const getUserWorkspaces = async (workspaceIds: IUserWorkspace[]) => {
    const data = [];
    for (const userWorkspace of workspaceIds) {
        const workspace = await Workspace.findOne({ _id: userWorkspace.id });
        data.push(workspace);
    }

    return data;
}