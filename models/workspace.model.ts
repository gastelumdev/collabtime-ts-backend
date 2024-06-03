import { Schema, model } from "mongoose";
import { IWorkspace, IWorkspaceDocument, IWorkspaceModel } from "../services/workspace.service";

const workspaceSchema: Schema<IWorkspaceDocument> = new Schema({
    name: { type: String, required: true },
    description: { type: String },
    tools: { type: Schema.Types.Mixed },
    invitees: { type: [] },
    members: { type: [] },
    owner: { type: Schema.Types.ObjectId },
    workspaceTags: { type: [] },
    tags: { type: [] },
    createdAt: { type: Date, default: Date.now }
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
    console.log({ newWorkspace, id })
    const workspace = await Workspace.findByIdAndUpdate(id, newWorkspace, { new: true });
    console.log({ workspace })
    return workspace;
}