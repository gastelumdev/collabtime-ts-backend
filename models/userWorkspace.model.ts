import { Schema, model } from "mongoose";
import { IUserWorkspaceDocument, IUserWorkspaceModel } from "../services/userWorkspace.service";
import { IUserWorkspace } from "../services/auth.service";

const userWorkspaceSchema: Schema<IUserWorkspaceDocument> = new Schema({
    userId: { type: Schema.Types.ObjectId },
    workspaceId: { type: Schema.Types.ObjectId },
}, {
    timestamps: true
});

userWorkspaceSchema.statics.buildUserWorkspace = (args: IUserWorkspace) => {
    return new UserWorkspace(args);
};

const UserWorkspace = model<IUserWorkspaceDocument, IUserWorkspaceModel>("userWorkspaces", userWorkspaceSchema);

export default UserWorkspace;