import { Document, Model } from "mongoose";
import User from "../models/auth.model";

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
    organization: string;
    logoURL: string;
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