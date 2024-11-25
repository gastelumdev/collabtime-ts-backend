import { Document, Schema, Model } from "mongoose";
import { IWorkspace } from "./workspace.service";
import UserGroup from "../models/userGroup.model";
import User from "../models/auth.model";
import DataCollection from "../models/dataCollection.model";
import Column from "../models/column.model";
import { admin, adminColumns, adminDataCollection, adminView, noAccessColumnPermissions, noAccessDataCollectionPermissions, noAccessPermissions, noAccessViewPermissions, viewOnly, viewOnlyColumns, viewOnlyDataCollection, viewOnlyView } from "../utils/defaultGroups";
import DataCollectionView from "../models/dataCollectionView.model";

export interface IUserGroup {
    name: string;
    workspace: Schema.Types.ObjectId;
    permissions: any;
    users: any[];
}

export interface IUserGroupDocument extends IUserGroup, Document { }

export interface IUserGroupModel extends Model<IUserGroupDocument> {
    buildUserGroup(args: IUserGroup): IUserGroupDocument;
}

export const createInitialSetup = async (workspace: IWorkspace & { _id: string }) => {
    const adminPermissions = admin;
    const viewOnlyPermissions = viewOnly;
    const members = workspace.members;
    const users = [];
    const adminDataCollectionPermissionsResult = []
    const viewOnlyDataCollectionPermissionsResult = []
    const noAccessDataCollectionPermissionsResult = []
    const adminViewPermissionsResult = []
    const viewOnlyViewPermissionsResult = []
    const noAccessViewPermissionsResult = []

    for (const member of members) {

        const user: any = await User.findOne({ email: member.email });
        users.push(user._id.toString());
    }

    const dataCollections = await DataCollection.find({ workspace: workspace._id });

    // Admin

    for (const dataCollection of dataCollections) {
        const columns = await Column.find({ dataCollection: dataCollection._id });
        let adminDataCollectionPermissions: any = adminDataCollection;

        const columnPermissions = []

        for (const column of columns) {
            columnPermissions.push({
                column: column._id,
                name: column.name,
                permissions: adminColumns
            })
        }

        adminDataCollectionPermissions = { ...adminDataCollectionPermissions, columns: columnPermissions }

        adminDataCollectionPermissionsResult.push({
            dataCollection: dataCollection._id,
            name: dataCollection.name,
            permissions: adminDataCollectionPermissions
        })
    }

    const views = await DataCollectionView.find({ workspace: workspace._id });

    for (const view of views) {
        let adminViewPermissions: any = adminView;

        const columnPermissions = [];

        for (const column of view.columns) {
            const col = await Column.findOne({ _id: column._id });

            columnPermissions.push({
                column: col?._id,
                name: col?.name,
                permissions: adminColumns
            })
        }



        adminViewPermissions = { ...adminViewPermissions, columns: columnPermissions };

        adminViewPermissionsResult.push({
            dataCollection: view.dataCollection,
            view: view._id,
            name: view.name,
            permissions: adminViewPermissions
        })
    }

    const adminUserGroup = new UserGroup({
        name: "All Privileges",
        workspace: workspace._id,
        permissions: { ...adminPermissions, dataCollections: adminDataCollectionPermissionsResult, views: adminViewPermissionsResult },
        users: users
    })

    adminUserGroup.save()

    // View only

    for (const dataCollection of dataCollections) {
        const columns = await Column.find({ dataCollection: dataCollection._id });
        let viewOnlyDataCollectionPermissions: any = viewOnlyDataCollection;

        const columnPermissions = []

        for (const column of columns) {
            columnPermissions.push({
                column: column._id,
                name: column.name,
                permissions: viewOnlyColumns
            })
        }

        viewOnlyDataCollectionPermissions = { ...viewOnlyDataCollectionPermissions, columns: columnPermissions };

        viewOnlyDataCollectionPermissionsResult.push({
            dataCollection: dataCollection._id,
            name: dataCollection.name,
            permissions: viewOnlyDataCollectionPermissions
        })
    }

    for (const view of views) {
        let viewOnlyViewPermissions: any = viewOnlyView;

        const columnPermissions = [];

        for (const column of view.columns) {
            const col = await Column.findOne({ _id: column._id });

            columnPermissions.push({
                column: col?._id,
                name: col?.name,
                permissions: viewOnlyColumns
            })
        }

        viewOnlyViewPermissions = { ...viewOnlyViewPermissions, columns: columnPermissions };

        viewOnlyViewPermissionsResult.push({
            dataCollection: view.dataCollection,
            view: view._id,
            name: view.name,
            permissions: viewOnlyViewPermissions
        })
    }

    const viewOnlyUserGroup = new UserGroup({
        name: "View Only",
        workspace: workspace._id,
        permissions: { ...viewOnlyPermissions, dataCollections: viewOnlyDataCollectionPermissionsResult, views: viewOnlyViewPermissionsResult },
        users: []
    })


    viewOnlyUserGroup.save()

    // No Accsss

    for (const dataCollection of dataCollections) {
        const columns = await Column.find({ dataCollection: dataCollection._id });
        let noAccessDataCollection: any = noAccessDataCollectionPermissions;

        const columnPermissions = []

        for (const column of columns) {
            columnPermissions.push({
                column: column._id,
                name: column.name,
                permissions: noAccessColumnPermissions
            })
        }

        noAccessDataCollection = { ...noAccessDataCollectionPermissions, columns: columnPermissions }

        noAccessDataCollectionPermissionsResult.push({
            dataCollection: dataCollection._id,
            name: dataCollection.name,
            permissions: noAccessDataCollection
        })
    }

    for (const view of views) {
        let noAccessView: any = noAccessViewPermissions;

        const columnPermissions = [];

        for (const column of view.columns) {
            const col = await Column.findOne({ _id: column._id });

            columnPermissions.push({
                column: col?._id,
                name: col?.name,
                permissions: noAccessColumnPermissions
            })
        }



        noAccessView = { ...noAccessView, columns: columnPermissions };

        noAccessViewPermissionsResult.push({
            dataCollection: view.dataCollection,
            view: view._id,
            name: view.name,
            permissions: noAccessView
        })
    }

    const noAccessUserGroup = new UserGroup({
        name: "No Access",
        workspace: workspace._id,
        permissions: { ...noAccessPermissions, dataCollections: noAccessDataCollectionPermissionsResult, views: noAccessViewPermissionsResult },
        users: []
    })
    noAccessUserGroup.save()
}

