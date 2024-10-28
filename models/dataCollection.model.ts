import mongoose, { Schema, Types, model } from "mongoose";
import { IDataCollection, IDataCollectionDocument, IDataCollectionModel } from "../services/dataCollection.service";
import { IWorkspace } from "../services/workspace.service";

const dataCollectionSchema: Schema<IDataCollectionDocument> = new Schema({
    name: { type: String, required: true },
    description: { type: String },
    workspace: { type: Schema.Types.ObjectId },
    row: { type: Schema.Types.ObjectId, default: null },
    template: { type: String, default: "default" },
    primaryColumnName: { type: String },
    form: { type: {} },
    columns: { type: [] },
    rows: { type: [] },
    tags: { type: [] },
    createdAt: { type: Date, default: Date.now },
    asTemplate: { type: {} },
    formRecipients: { type: [] },
    autoIncremented: { type: Boolean },
    autoIncrementPrefix: { type: String },
    belongsToAppModel: { type: Boolean, default: false },
    main: { type: Boolean, default: true },
    appModel: { type: Schema.Types.ObjectId, default: null },
    inParentToDisplay: { type: Schema.Types.ObjectId, default: null },
    filters: { type: {} },
    appType: { type: String, default: null },
    userGroupAccess: { type: [], default: [] }
}, {
    timestamps: true
});

dataCollectionSchema.statics.buildDataCollection = (args: IDataCollection) => {
    return new DataCollection(args);
}

const DataCollection = model<IDataCollectionDocument, IDataCollectionModel>("dataCollections", dataCollectionSchema);

export default DataCollection;

/**
 * Finds data collections associated with a specific workspace.
 *
 * This function retrieves all data collection documents from the database
 * that are associated with the provided workspace ID. It uses the `DataCollection.find` method
 * to perform the query based on the workspace ID.
 *
 * @param {IWorkspace & { _id: string }} workspace - The workspace object, including its ID.
 * @returns {Promise<Array>} - A promise that resolves to an array of data collection objects
 *                             associated with the workspace.
 *
 * @note This function is not part of automated testing and needs to have automated tests implemented.
 */
export const findDataCollectionsBasedOnWorkspace = async (workspace: IWorkspace & { _id: string }) => {
    const dataCollections = await DataCollection.find({ workspace: workspace?._id });
    return dataCollections;
}