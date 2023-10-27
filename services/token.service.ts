import { Document, Schema, Model } from "mongoose";

export interface IToken {
    userId: Schema.Types.ObjectId;
    token: string;
    createdAt: Date;
};

export interface ITokenDocument extends IToken, Document {}

export interface ITokenModel extends Model<ITokenDocument> {
    buildToken(args: IToken): ITokenDocument;
}