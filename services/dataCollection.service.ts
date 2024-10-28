import { Document, Schema, Model } from "mongoose";
import { ITag } from "./tag.service";
import { IWorkspace } from "./workspace.service";
import DataCollection from "../models/dataCollection.model";
import * as dataCollectionModel from "../models/dataCollection.model";
import Cell from "../models/cell.models";
import Row from "../models/row.models";
import Column from "../models/column.model";

export type TForm = {
    active: boolean;
    type: string;
    emails: string[];
}

export interface IDataCollection {
    name: string;
    description: string;
    workspace: Schema.Types.ObjectId;
    row?: Schema.Types.ObjectId | null;
    template: string;
    primaryColumnName: string;
    form: TForm;
    columns: string[];
    rows: string[];
    tags: ITag[];
    createdAt: Date;
    asTemplate: { active: boolean, name: string };
    formRecipients: { sent: true, email: string }[];
    autoIncremented: boolean;
    autoIncrementPrefix: string;
    belongsToAppModel?: boolean;
    main?: boolean;
    appModel?: Schema.Types.ObjectId | null;
    inParentToDisplay?: Schema.Types.ObjectId | null;
    filters?: any;
    appType?: string | null;
    userGroupAccess?: string[];
}

export interface IDataCollectionDocument extends IDataCollection, Document { }

export interface IDataCollectionModel extends Model<IDataCollectionDocument> {
    buildDataCollection(args: IDataCollection): IDataCollectionDocument
}

/**
 * Removes all data collections associated with a workspace.
 *
 * This function retrieves all data collections associated with the provided workspace,
 * then deletes all related rows, columns, and the data collection documents from the database.
 *
 * @param {IWorkspace & { _id: string }} workspace - The workspace object, including its ID.
 * @returns {Promise<void>} - A promise that resolves once all associated data collections and related data are deleted.
 *
 * @note This function is not part of automated testing and needs to have automated tests implemented.
 */
export const removeWorkspaceDataCollections = async (workspace: IWorkspace & { _id: string }) => {
    // Get all the data collections in the workspace
    // const dataCollections = await DataCollection.find({ workspace: workspace?._id });
    const dataCollections = await dataCollectionModel.findDataCollectionsBasedOnWorkspace(workspace);

    // Delete any data collections associated to the workspace
    for (const dataCollection of dataCollections) {
        const dataCollectionId = dataCollection._id;
        await Row.deleteMany({ dataCollection: dataCollectionId });
        await Column.deleteMany({ dataCollection: dataCollectionId });
        await DataCollection.findByIdAndDelete({ _id: dataCollectionId });
    }
}
