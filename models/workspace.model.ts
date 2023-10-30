import mongoose, {Schema, Types, model} from "mongoose";
import { IWorkspace, IWorkspaceDocument, IWorkspaceModel } from "../services/workspace.service";

const workspaceSchema: Schema<IWorkspaceDocument> = new Schema({
    name: {type: String, required: true},
    description: {type: String},
    tools: {type: Schema.Types.Mixed},
    invitees: {type: []},
    owner: {type: Schema.Types.ObjectId},
    createdAt: {type: Date, default: Date.now}
},{
    timestamps: true
});

workspaceSchema.statics.buildWorkspace = (args: IWorkspace) => {
    return new Workspace(args);
};

const Workspace = model<IWorkspaceDocument, IWorkspaceModel>("workspaces", workspaceSchema);

export default Workspace;