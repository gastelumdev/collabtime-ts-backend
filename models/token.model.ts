import mongoose, {Schema, Types, model} from "mongoose";
import { IToken, ITokenDocument, ITokenModel} from "../services/token.service";

const tokenSchema: Schema<ITokenDocument> = new Schema({
    userId: {type: Schema.Types.ObjectId, required: true, ref: "user"},
    token: {type: String, required: true},
    createdAt: {type: Date, default: Date.now, expires: 3600}
},{
    timestamps: true,
});

tokenSchema.statics.buildToken = (args: IToken) => {
    return new Token(args);
};

const Token = model<ITokenDocument, ITokenModel>("tokens", tokenSchema);

export default Token;