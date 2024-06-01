import { Document, Schema, Model } from "mongoose";
import { ITag } from "./tag.service";
import Workspace from "../models/workspace.model";
import { IUser, IUserWorkspace } from "./auth.service";
import User from "../models/auth.model";

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

/**
 * This asynchronous function retrieves workspace documents from the database
 * based on an array of user workspace objects.
 * 
 * @param {IUserWorkspace[]} userWorkspaceObjects - An array of objects containing user workspace details, 
 *        each object includes an `id` property representing the workspace ID.
 * 
 * @returns {Promise<Workspace[]>} - A promise that resolves to an array of workspace documents.
 */
export const getUserWorkspaces = async (userWorkspaceObjects: IUserWorkspace[]) => {
    const workspaces = [];
    for (const userWorkspaceObject of userWorkspaceObjects) {
        const workspace = await Workspace.findOne({ _id: userWorkspaceObject.id });
        workspaces.push(workspace);
    }
    return workspaces;
}

/**
 * This asynchronous function creates a new workspace in the database.
 * 
 * @param {IWorkspace} newWorkspace - An object containing the details of the new workspace to be created.
 * @param {IUser} user - The user object representing the owner of the new workspace.
 * 
 * @returns {Promise<Workspace>} - The newly created workspace object.
 */
export const createNewWorkspace = async (newWorkspace: IWorkspace, user: IUser) => {
    const workspace = new Workspace({ ...newWorkspace, owner: user._id });
    workspace.members.push({ email: user?.email as string, permissions: 2 });
    await workspace.save();
    return workspace;
}

export const addWorkspaceToUser = async (workspace: IWorkspace & { _id: string }, user: IUser) => {
    const userWorkspaces = user?.workspaces;
    userWorkspaces?.push({ id: workspace._id, permissions: 2 });
    const updatedUser = await User.updateOne({ _id: user._id }, { $set: { workspaces: userWorkspaces } });
    return updatedUser;
}