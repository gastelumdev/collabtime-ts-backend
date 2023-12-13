import { Document, Schema, Model } from "mongoose";

export interface ITag {
    workspace: Schema.Types.ObjectId;
    name: string;
    createdAt: Date;
}

export interface ITagDocument extends ITag, Document {}

export interface ITagModel extends Model<ITagDocument> {
    buildTag(args: ITag): ITagDocument;
}