import { Document, Model } from "mongoose";

export interface IUserWorkspace {
    id: string;
    permissions: number;
}

export interface IUser {
    _id?: string;
    firstname: string;
    lastname: string;
    email: string;
    password: string;
    role?: string;
    workspaces: IUserWorkspace[];
    created_at: Date;
};

export interface IUserDocument extends IUser, Document {
    _id: string;
}

export interface IUserModel extends Model<IUserDocument> {
    buildUser(args: IUser): IUserDocument;
}