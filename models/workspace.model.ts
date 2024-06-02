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