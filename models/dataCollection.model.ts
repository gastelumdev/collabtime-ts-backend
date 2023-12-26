import mongoose, {Schema, Types, model} from "mongoose";
import { IDataCollection, IDataCollectionDocument, IDataCollectionModel } from "../services/dataCollection.service";

const dataCollectionSchema: Schema<IDataCollectionDocument> = new Schema({
    name: {type: String, required: true},
    description: {type: String},
    workspace: {type: Schema.Types.ObjectId},
    template: {type: String, default: "default"},
    form: {type: {}},
    columns: {type: []},
    rows: {type: []},
    tags: {type: []},
    createdAt: {type: Date, default: Date.now},
    asTemplate: {type: {}},
    formRecipients: {type: []},
},{
    timestamps: true
});

dataCollectionSchema.statics.buildDataCollection = (args: IDataCollection) => {
    return new DataCollection(args);
}

const DataCollection = model<IDataCollectionDocument, IDataCollectionModel>("dataCollections", dataCollectionSchema);

export default DataCollection;