import { Document, Schema, Model } from "mongoose";

export interface IUserGroup {
    name: string;
    workspace: Schema.Types.ObjectId;
    permissions: any;
    users: any[];
}

export interface IUserGroupDocument extends IUserGroup, Document { }

export interface IUserGroupModel extends Model<IUserGroupDocument> {
    buildUserGroup(args: IUserGroup): IUserGroupDocument;
}

