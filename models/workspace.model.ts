import { Schema, model } from "mongoose";
import { IWorkspace, IWorkspaceDocument, IWorkspaceModel } from "../services/workspace.service";
import { IUser } from "../services/auth.service";

const workspaceSchema: Schema<IWorkspaceDocument> = new Schema({
    name: { type: String, required: true },
    description: { type: String },
    tools: { type: Schema.Types.Mixed },
    invitees: { type: [] },
    members: { type: [] },
    owner: { type: Schema.Types.ObjectId },
    workspaceTags: { type: [] },
    tags: { type: [] },
    createdAt: { type: Date, default: Date.now },
    type: { type: String, default: 'basic' },
    settings: { type: {}, default: null }
}, {
    timestamps: true
});

workspaceSchema.statics.buildWorkspace = (args: IWorkspace) => {
    return new Workspace(args);
};

const Workspace = model<IWorkspaceDocument, IWorkspaceModel>("workspaces", workspaceSchema);

export default Workspace;

/**
 * Fetches a workspace document from the database by its ID.
 *
 * This asynchronous function searches the `Workspace` collection
 * for a document with the specified ID. It logs the retrieved workspace
 * and the ID to the console, and then returns the workspace document.
 *
 * @param {string} id - The unique identifier of the workspace to retrieve.
 * @returns {Promise<Object|null>} - A promise that resolves to the workspace document
 *                                   if found, or null if no workspace is found with the given ID.
 */
export const getWorkspaceById = async (id: string) => {
    const workspace = await Workspace.findById(id);
    return workspace;
}

/**
 * Updates a workspace document in the database by its ID.
 *
 * This asynchronous function searches the `Workspace` collection for a document with the specified ID
 * and updates it with the provided new workspace data. It returns the updated workspace document.
 *
 * @param {string} id - The unique identifier of the workspace to update.
 * @param {IWorkspace} newWorkspace - An object containing the new data for the workspace.
 * @returns {Promise<Object|null>} - A promise that resolves to the updated workspace document
 *                                   if the update is successful, or null if no workspace is found with the given ID.
 */
export const getWorkspaceByIdAndUpdate = async (id: string, newWorkspace: IWorkspace) => {
    const workspace = await Workspace.findByIdAndUpdate(id, newWorkspace, { new: true });
    return workspace;
}

/**
 * Retrieves a workspace by its ID and owner.
 *
 * This function fetches a single workspace document from the database 
 * that matches the provided workspace ID and owner (user) ID. 
 * It uses the `Workspace.findOne` method to perform the query.
 *
 * @param {string} workspaceId - The ID of the workspace to retrieve.
 * @param {string} userId - The ID of the user who owns the workspace.
 * @returns {Promise<Object|null>} - A promise that resolves to the workspace object if found,
 *                                    or null if no workspace matches the criteria.
 * 
 * @note This function is not part of automated testing and needs to have automated tests implemented.
 */
export const getOneByIdBasedOnOwner = async (workspaceId: string, userId: string) => {
    const workspace = await Workspace.findOne({ _id: workspaceId, owner: userId });
    return workspace;
}

/**
 * Deletes a workspace based on its ID and owner.
 *
 * This function deletes a workspace document from the database that matches
 * the provided workspace ID and owner (user) ID. It uses the `Workspace.findByIdAndDelete` method
 * to perform the deletion.
 *
 * @param {string} id - The ID of the workspace to delete.
 * @param {string} userId - The ID of the owner (user) of the workspace.
 * @returns {Promise<void>} - A promise that resolves once the workspace is successfully deleted.
 *
 * @note This function is not part of automated testing and needs to have automated tests implemented.
 */
export const getWorkspaceByIdAndDelete = async (id: string, userId: string) => {
    await Workspace.findByIdAndDelete({ _id: id, owner: userId });
}