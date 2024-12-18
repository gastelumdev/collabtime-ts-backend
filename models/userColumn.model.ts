import { Schema, model } from "mongoose";
import { IUserColumnDocument, IUserColumnModel, IUserColumn } from "../services/userColumn.service";

const userColumnSchema: Schema<IUserColumnDocument> = new Schema({
    userId: { type: Schema.Types.ObjectId },
    dataCollectionId: { type: Schema.Types.ObjectId, default: null },
    dataCollectionViewId: { type: Schema.Types.ObjectId, default: null },
    columnId: { type: Schema.Types.ObjectId },
    width: { type: String, default: "180px" }
}, {
    timestamps: true
});

userColumnSchema.statics.buildUserColumn = (args: IUserColumn) => {
    return new UserColumn(args);
};

const UserColumn = model<IUserColumnDocument, IUserColumnModel>("userColumns", userColumnSchema);

export default UserColumn;