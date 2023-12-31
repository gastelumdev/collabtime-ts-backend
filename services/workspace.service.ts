import { Document, Schema, Model } from "mongoose";
import { ITag } from "./tag.service";

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

export interface IWorkspaceDocument extends IWorkspace, Document {}

export interface IWorkspaceModel extends Model<IWorkspaceDocument> {
    buildWorkspace(args: IWorkspace): IWorkspaceDocument;
}

