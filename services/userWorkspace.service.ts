import { Document, Schema, Model } from "mongoose";

export interface IUserWorkspace {
    userId: Schema.Types.ObjectId;
    workspaceId: Schema.Types.ObjectId;
}

export interface IUserWorkspaceDocument extends IUserWorkspace, Document {

}

export interface IUserWorkspaceModel extends Model<IUserWorkspaceDocument> {
    buildWorkspace(args: IUserWorkspace): IUserWorkspaceDocument;
}