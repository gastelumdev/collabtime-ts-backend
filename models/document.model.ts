import mongoose, {Schema, Types, model} from "mongoose";
import { IDocument, IDocumentDocument, IDocumentModel } from "../services/document.service";

const documentSchema: Schema<IDocumentDocument> = new Schema({
    workspace: {type: Schema.Types.ObjectId},
    createdBy: {type: {}},
    filename: {type: String},
    type: {type: String},
    originalname: {type: String},
    url: {type: String},
    ext: {type: String},
    value: {type: String},
    file: {type: {}}
},{
    timestamps: true
});

documentSchema.statics.buildDocument = (args: IDocument) => {
    return new Document(args);
}

const Document = model<IDocumentDocument, IDocumentModel>("documents", documentSchema);

export default Document;