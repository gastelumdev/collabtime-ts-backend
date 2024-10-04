import { Document, Schema, Model } from "mongoose";
import { ITag } from "./tag.service";
import Workspace from "../models/workspace.model";
import { IUser, IUserWorkspace } from "./auth.service";
import User from "../models/auth.model";
import * as authModel from "../models/auth.model";

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
    tools?: TTools;
    invitees: TInvitee[];
    members: TInvitee[];
    owner: Schema.Types.ObjectId;
    workspaceTags: ITag[];
    tags: ITag[];
    createdAt: Date | null;
}

export interface IWorkspaceDocument extends IWorkspace, Document {
}

export interface IWorkspaceModel extends Model<IWorkspaceDocument> {
    buildWorkspace(args: IWorkspace): IWorkspaceDocument;
}

/**
 * Retrieves a list of workspaces based on an array of user workspace objects.
 * 
 * @param {IUserWorkspace[]} userWorkspaceObjects - An array of user workspace objects, where each object contains an `id` field representing the workspace ID.
 * 
 * @returns {Promise<IWorkspace[]>} - A promise that resolves to an array of workspace objects.
 * 
 * The function performs the following steps:
 * 1. Initializes an empty array to store the retrieved workspaces.
 * 2. Iterates over each user workspace object in the input array.
 * 3. For each user workspace object, finds the corresponding workspace in the database using the workspace ID.
 * 4. Adds the found workspace to the array of workspaces.
 * 5. Returns the array of retrieved workspaces.
 * 
 * Note: The function assumes that the `Workspace` model has a `findOne` method that retrieves a workspace by its `_id`.
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
 * Creates a new workspace and associates it with the given user.
 * 
 * @param {IWorkspace} newWorkspace - The new workspace object containing workspace details.
 * @param {IUser} user - The user object representing the owner of the new workspace.
 * 
 * @returns {Promise<IWorkspace>} - A promise that resolves to the newly created workspace object.
 * 
 * The function performs the following steps:
 * 1. Creates a new `Workspace` instance with the provided workspace details, setting the owner to the user's `_id`.
 * 2. Adds the user to the workspace's members list with a default permission level of 2.
 * 3. Saves the new workspace to the database.
 * 4. Returns the newly created workspace object.
 * 
 * Note: The function assumes that the `Workspace` model has a `members` array where each member object contains an `email` and `permissions` field.
 */
export const createNewWorkspace = async (newWorkspace: IWorkspace, user: IUser): Promise<IWorkspace> => {
    const workspace = new Workspace({ ...newWorkspace, owner: user._id });
    workspace.members.push({ email: user?.email as string, permissions: 2 });
    await workspace.save();
    return workspace;
}


/**
 * Adds a workspace to a user's list of workspaces and updates the user in the database.
 * 
 * @param {IWorkspace} workspace - The workspace object to be added, which includes an `_id` property.
 * @param {IUser} user - The user object to which the workspace will be added.
 * 
 * @returns {Promise<any>} - A promise that resolves to the result of the database update operation.
 * 
 * The function performs the following steps:
 * 1. Retrieves the user's current list of workspaces.
 * 2. Adds the new workspace with a default permission level of 2 to the list.
 * 3. Updates the user document in the database with the new list of workspaces.
 * 
 * Note: The function assumes that `user.workspaces` is an array. If `user.workspaces` is undefined, 
 *       the optional chaining operator `?.` prevents errors during the push operation.
 */
export const addWorkspaceToUser = async (workspace: IWorkspace & { _id: string }, user: IUser) => {
    const userWorkspaces = user?.workspaces;
    userWorkspaces?.push({ id: workspace._id, permissions: 2 });
    const updatedUser: any = await User.findOne({ _id: user._id });
    updatedUser.workspaces = userWorkspaces;
    updatedUser.save();
    return updatedUser;
}

/**
 * Removes a workspace association from all members of the workspace.
 *
 * This function iterates through each member of the provided workspace and removes 
 * the workspace association from each member's record. It uses the `authModel.getUserByEmail`
 * method to retrieve each member and the `authModel.removeWorkspaceFromUser` method to update them.
 *
 * @param {IWorkspace & { _id: string }} workspace - The workspace object, including its ID and members list.
 * @returns {Promise<Array>} - A promise that resolves to an array of updated user objects.
 *
 * @note This function is not part of automated testing and needs to have automated tests implemented.
 */
export const removeWorkspaceFromMembers = async (workspace: IWorkspace & { _id: string }) => {
    // Holds the updated users to compare during testing
    const updatedUsers = []
    // Go through each member associated to the workspace and remove the association
    for (const member of workspace?.members) {
        // const currentMember: IUser | null = await User.findOne({ email: member.email });
        const currentMember: IUser | null = await authModel.getUserByEmail(member.email);

        const updatedUser = await authModel.removeWorkspaceFromUser(workspace?._id, currentMember as IUser);
        updatedUsers.push(updatedUser);
    }

    return updatedUsers;
}