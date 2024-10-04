import { Request, Response } from "express";
import UserGroup from "../models/userGroup.model";
import mongoose from "mongoose";
import DataCollection from "../models/dataCollection.model";
import DataCollectionView from "../models/dataCollectionView.model";
import util from 'util';
import { adminColumns, adminDataCollection, adminView, emptyColumnPermissions, emptyDataCollectionPermissions, emptyViewPermissions, viewOnlyColumns, viewOnlyDataCollection, viewOnlyView } from "../utils/defaultGroups";
import Column from "../models/column.model";

export const getUserGroups = async (req: Request, res: Response) => {
    try {
        const { workspaceId } = req.params;
        const userGroups = await UserGroup.find({ workspace: workspaceId });
        const dataCollections = await DataCollection.find({ workspace: workspaceId });
        const views = await DataCollectionView.find({ workspace: workspaceId })

        let newUserGroups = []

        console.log({ userGroups })
        console.log({ dataCollections })
        console.log({ views })

        for (const userGroup of userGroups) {
            let dataCollectionsResult = []
            let viewsResult = []
            let changeMade = false;
            const defaultDataCollectionPermissions = userGroup.name === "All Privileges" ? adminDataCollection : userGroup.name === "View Only" ? viewOnlyDataCollection : emptyDataCollectionPermissions;
            const defaultViewPermissions = userGroup.name === "All Privileges" ? adminView : userGroup.name === "View Only" ? viewOnlyView : emptyViewPermissions;
            const defaultColumnPermissions = userGroup.name === "All Privileges" ? adminColumns : userGroup.name === "View Only" ? viewOnlyColumns : emptyColumnPermissions;

            for (const dataCollection of dataCollections) {
                const dataCollectionPermissions = userGroup.permissions.dataCollections.find((dc: any) => {
                    return dc.dataCollection.toString() === dataCollection._id.toString()
                })

                if (dataCollectionPermissions === undefined) {
                    const columns = await Column.find({ dataCollection: dataCollection._id });
                    let columnsResult = []

                    for (const column of columns) {
                        columnsResult.push({ column: column._id, name: column.name, permissions: defaultColumnPermissions })
                    }


                    dataCollectionsResult.push({ dataCollection: dataCollection._id, name: dataCollection.name, permissions: { ...defaultDataCollectionPermissions, columns: columnsResult } });
                    changeMade = true;
                } else {
                    const columns = await Column.find({ dataCollection: dataCollection._id });
                    let columnsResult = []

                    for (const column of columns) {
                        const columnPermissions = dataCollectionPermissions.permissions.columns.find((col: any) => {
                            return col.column.toString() === column._id.toString();
                        })

                        if (columnPermissions === undefined) {
                            columnsResult.push({ column: column._id, name: column.name, permissions: defaultColumnPermissions });
                            changeMade = true;
                        } else {
                            columnsResult.push({ ...columnPermissions, column: column._id, name: column.name })
                        }
                    }

                    dataCollectionsResult.push({ ...dataCollectionPermissions, dataCollection: dataCollection._id, name: dataCollection.name, permissions: { ...dataCollectionPermissions.permissions, columns: columnsResult } });
                }
            }

            for (const view of views) {
                const viewPermissions = userGroup.permissions.views.find((v: any) => {
                    return v.view.toString() === view._id.toString()
                })

                if (viewPermissions === undefined) {
                    const columns = view.columns;
                    let columnsResult = []

                    for (const column of columns) {
                        columnsResult.push({ column: column._id, name: column.name, permissions: defaultColumnPermissions })
                    }
                    viewsResult.push({ dataCollection: view.dataCollection, view: view._id, name: view.name, permissions: { ...defaultViewPermissions, columns: columnsResult } });
                    changeMade = true;
                } else {
                    const columns = view.columns;
                    let columnsResult = []

                    for (const column of columns) {
                        const columnPermissions = viewPermissions.permissions.columns.find((col: any) => {
                            return col.column.toString() === column._id.toString();
                        })

                        if (columnPermissions === undefined) {
                            columnsResult.push({ column: column._id, name: column.name, permissions: defaultColumnPermissions });
                            changeMade = true;
                        } else {
                            columnsResult.push({ ...columnPermissions, column: column._id, name: column.name })
                        }
                    }

                    viewsResult.push({ ...viewPermissions, dataCollection: view.dataCollection, view: view._id, name: view.name, permissions: { ...viewPermissions.permissions, columns: columnsResult } });
                }
            }

            if ((dataCollections.length !== userGroup.permissions.dataCollections.length) || (views.length !== userGroup.permissions.views.length)) {
                changeMade = true;
            }

            if (changeMade) {
                console.log({ viewsResult })
                const userGroupObj = userGroup.toObject()
                const newUserGroup = { ...userGroupObj, permissions: { ...userGroupObj.permissions, dataCollections: dataCollectionsResult, views: viewsResult } }

                console.log(util.inspect(newUserGroup, { showHidden: false, depth: null, colors: true }))

                const updatedUserGroup = await UserGroup.findByIdAndUpdate(userGroup._id, newUserGroup, { new: true })
                console.log(updateUserGroup)
                // console.log(newUserGroup)
                newUserGroups.push(updatedUserGroup)
            } else {
                newUserGroups.push(userGroup)
            }
        }

        console.log(newUserGroups)
        res.send(newUserGroups);
    } catch (err) {
        res.status(400).send({ success: false })
    }
}

export const createUserGroups = async (req: Request, res: Response) => {
    try {
        const newUserGroup = new UserGroup(req.body);
        newUserGroup.save();

        res.send({ success: true });
    } catch (err) {
        res.status(400).send({ success: false })
    }
}

export const updateUserGroup = async (req: Request, res: Response) => {
    try {
        const newUserGroup = req.body;

        console.log(util.inspect(newUserGroup))

        await UserGroup.findByIdAndUpdate({ _id: newUserGroup._id }, newUserGroup, { new: true });

        res.send({ success: true });

    } catch (err) {
        res.status(400).send({ success: false })
    }
}

export const deleteUserGroup = async (req: Request, res: Response) => {
    try {
        const userGroupId = new mongoose.Types.ObjectId(req?.params.userGroupId);

        await UserGroup.findByIdAndDelete(userGroupId)

        res.send({ success: true });

    } catch (err) {
        res.status(400).send({ success: false })
    }
}