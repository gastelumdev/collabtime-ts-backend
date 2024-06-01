import { Document, Schema, Model } from "mongoose";
import { ITag } from "./tag.service";
import Workspace from "../models/workspace.model";
import { IUser, IUserWorkspace } from "./auth.service";
import { TUser, TWorkspace } from "../types";

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
    createdAt: Date | null;
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

export const createNewWorkspace = async (newWorkspace: IWorkspace, user: IUser) => {
    const workspace = new Workspace({ ...newWorkspace, owner: user._id });
    workspace.members.push({ email: user?.email as string, permissions: 2 });
    await workspace.save();
    return workspace;
}