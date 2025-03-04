import { Document, Model, Schema } from "mongoose";
import User from "../models/auth.model";
import { TInvitee } from "../types";
import { IWorkspace } from "./workspace.service";
import { IColumn } from "./column.service";
import { IRow } from "./row.service";

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
    defaultWorkspaceId: string | null;
    created_at: Date;
};

export interface IUserDocument extends IUser, Document {
    _id: string;
}

export interface IUserModel extends Model<IUserDocument> {
    buildUser(args: IUser): IUserDocument;
}

/**
 * Removes a workspace from a user's list of workspaces.
 *
 * This function filters out the specified workspace from the user's list of workspaces.
 * It checks each workspace in the user's list and excludes the one that matches the provided workspace ID.
 *
 * @param {string} workspaceId - The ID of the workspace to be removed.
 * @param {IUser} user - The user object which contains the list of workspaces.
 * @returns {Array} - A new array of workspaces excluding the one with the specified ID.
 * 
 * @note This function is not part of automated testing and needs to have automated tests implemented.
 */
export const removeWorkspaceFromUser = (workspaceId: string, user: IUser): Array<any> => {
    const newUserWorkspaces = user?.workspaces.filter((item: { id: string, permissions: number }) => {
        return workspaceId.toString() !== item.id.toString();
    });
    return newUserWorkspaces;
}

export const getAllAssigneeIds = async (columns: IColumn[], row: IRow) => {
    const allAssigneeIds = []

    for (const column of columns) {
        if (column.type === "people") {
            const assignedUsers = row.values[column.name];
            if (assignedUsers !== undefined) {
                for (const assignedUser of assignedUsers) {
                    const assignee = await User.findOne({ email: assignedUser.email })
                    allAssigneeIds.push(assignee?._id.toString())
                }
            }

        }
    }

    return allAssigneeIds;
}