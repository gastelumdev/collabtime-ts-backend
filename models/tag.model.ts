import mongoose, {Schema, Types, model} from "mongoose";
import {ITag, ITagDocument, ITagModel} from "../services/tag.service";

const tagSchema: Schema<ITagDocument> = new Schema({
    workspace: {type: Schema.Types.ObjectId, required: true},
    name: {type: String},
    createdAt: {type: Date, default: Date.now}
}, {
    timestamps: true
});

tagSchema.statics.buildTag = (args: ITag) => {
    return new Tag(args);
};

const Tag = model<ITagDocument, ITagModel>("tags", tagSchema);

export default Tag;