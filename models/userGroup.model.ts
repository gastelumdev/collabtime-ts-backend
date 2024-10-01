import mongoose, { Schema, Types, model } from "mongoose";
import { IUserGroup, IUserGroupDocument, IUserGroupModel } from "../services/userGroup.service";

const userGroupSchema: Schema<IUserGroupDocument> = new Schema({
    name: { type: String },
    workspace: { type: Schema.Types.ObjectId },
    permissions: { type: {} },
    users: { type: [] }
}, {
    timestamps: true
});

userGroupSchema.statics.buildUserGroup = (args: IUserGroup) => {
    return new UserGroup(args);
}

const UserGroup = model<IUserGroupDocument, IUserGroupModel>("userGroups", userGroupSchema);

export default UserGroup;