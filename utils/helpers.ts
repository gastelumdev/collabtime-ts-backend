import Cell from "../models/cell.models";
import Column from "../models/column.model";
import DataCollection from "../models/dataCollection.model";
import Row from "../models/row.models";
import util from 'util';
import UserGroup from "../models/userGroup.model";
import DataCollectionView from "../models/dataCollectionView.model";
import { admin, adminColumns, adminDataCollection, adminView, noAccessColumnPermissions, noAccessDataCollectionPermissions, noAccessPermissions, noAccessViewPermissions, viewOnly, viewOnlyColumns, viewOnlyDataCollection, viewOnlyView } from "./defaultGroups";
import User from "../models/auth.model";
import Workspace from "../models/workspace.model";
import UserWorkspace from "../models/userWorkspace.model";
import { IIntegrationSettings, IWorkspace, IWorkspaceSettings } from "../services/workspace.service";
import axios from "axios";
import SwiftSensorsIntegration from "./integrationApp/swiftSensors/SwiftSensorsIntegration";
import SwiftSensorsAPIAuth from "./integrationApp/swiftSensors/Auth";
import Threshold from "./integrationApp/swiftSensors/Threshold";
import { settings, workspaceIds } from "../env";

export const convertRowCells = async () => {
    const dataCollections = await DataCollection.find({ _id: "65c3c566290dd890c63ef4c9" });

    for (const dataCollection of dataCollections) {
        const rows = await Row.find({ dataCollection: dataCollection._id });


        for (let i = 0; i < rows.length; i++) {
            const row: any = await Row.findOne({ _id: rows[i]._id });
            row.position = i + 1;
            row.save()
        }
    }
}

export const addValues = async () => {
    const dataCollections = await DataCollection.find({ _id: "65a95bb6dafe49be8c94dda8" });

    for (const dataCollection of dataCollections) {
        const rows = await Row.find({ dataCollection: dataCollection._id });
        const columns = await Column.find({ dataCollection: dataCollection._id });

        for (const row of rows) {
            const values: any = {};
            for (const column of columns) {
                const cell: any = await Cell.findOne({ dataCollection: dataCollection._id, name: column.name, row: row._id });
                if (cell && cell.value) {
                    const value = cell.value === undefined ? "" : cell.value;
                    values[column.name] = value;
                } else {
                    values[column.name] = "";
                }

            }
            if (row.values === undefined) {
                row.values = values;
                row.save();
            }

        }
    }
}

export const fullfillMissingRows = async () => {
    const dataCollections = await DataCollection.find({});


    for (const dataCollection of dataCollections) {
        const columns = await Column.find({ dataCollection: dataCollection._id });
        const rows = await Row.find({ dataCollection: dataCollection._id });

        const length = rows.length;

        const values: any = {};

        for (const column of columns) {
            values[column.name] = "";
        }

        if (length < 50) {
            const numberOfMissingRows = 50 - 0;

            for (let i = length + 1; i <= 50; i++) {
                const row = new Row({
                    dataCollection: dataCollection._id,
                    values: values,
                    position: i,
                })
                row.save();
            }
        }
    }
}

const convertAssignedTo = async () => {
    const rows = await Row.find({});
    for (const row of rows) {
        const assignedToArr = [];
        let assigned_to = row.values['assigned_to'];
        if (assigned_to !== undefined && assigned_to !== '' && typeof assigned_to == 'string') {

            let splitValue: any = assigned_to.split(' - ');
            let name = splitValue[0];
            let email = splitValue[1];

            if (email !== undefined) {
                assignedToArr.push({ name: splitValue[0], email: splitValue[1] });
            }
        }

        row.values = { ...row.values, assigned_to: assignedToArr };

        const updatedRow = await Row.findByIdAndUpdate(row._id, { values: row.values }, { new: true });
    }

};

const checkForEmptyRows = async () => {
    const rows = await Row.find({}).sort({ position: 1 });



    for (const row of rows) {
        let isEmpty = true;
        for (const key in row.values) {
            const value = row.values[key]
            if (typeof value === "string") {
                if (value !== "") {
                    isEmpty = false;
                }
            } else {
                if (value.length > 0) {
                    isEmpty = false;
                }
            }
        }
        const updatedRow = await Row.findByIdAndUpdate(row._id, { isEmpty }, { new: true });
    }
}



const createUserGroups = async () => {
    const workspaces = await Workspace.find({});

    const adminPermissions = admin;
    const viewOnlyPermissions = viewOnly;

    for (const workspace of workspaces) {

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
}

const addPublic = async () => {
    const dataCollectionViews = await DataCollectionView.find({});

    for (const dcView of dataCollectionViews) {
        const newDcView = await DataCollectionView.findByIdAndUpdate(dcView._id, { ...dcView.toObject(), public: false });
    }
}


const addLabelsToUserGroups = async () => {
    const userGroups = await UserGroup.find({});

    for (const userGroup of userGroups) {
        const newViewsPermissions = []

        for (const viewsPermissions of userGroup.permissions.views) {
            const newColumnPermissions = []

            for (const columnPermissions of viewsPermissions.permissions.columns) {
                const column: any = await Column.findOne({ _id: columnPermissions.column });
                let labelsArray = [];
                if (['label', 'status'].includes(column?.type)) {
                    labelsArray = column.labels.map((item: any) => {
                        return item.title;
                    })
                } else {
                    labelsArray = []
                }
                newColumnPermissions.push({ ...columnPermissions, permissions: { ...columnPermissions.permissions, labels: [...labelsArray] } })
            }

            newViewsPermissions.push({ ...viewsPermissions, permissions: { ...viewsPermissions.permissions, columns: newColumnPermissions } })
        }
        const newUserGroup = { ...userGroup.toObject(), permissions: { ...userGroup.toObject().permissions, views: newViewsPermissions } }

        const updatedUserGroup = await UserGroup.findByIdAndUpdate(userGroup._id, newUserGroup, { new: true })
    }
}

export const autoIncrementProjectNumber = async () => {
    const rows = await Row.find({ dataCollection: "67057d117d1328e3a49b9635" }).sort({ position: 1 });
    const firstColumn: any = await Column.findOne({ dataCollection: "67057d117d1328e3a49b9635", position: 1 });

    // Auto incrementing id section
    let i = 1;
    let identifier = 'P'
    // let leadingZeroes = ""

    for (const row of rows) {
        // if (i >= 100000) {
        //     leadingZeroes = ""
        // } else if (i >= 10000) {
        //     leadingZeroes = "0"
        // } else if (i >= 1000) {
        //     leadingZeroes = "00"
        // } else if (i >= 100) {
        //     leadingZeroes = "000"
        // } else if (i >= 10) {
        //     leadingZeroes = "0000"
        // } else {
        //     leadingZeroes = "00000"
        // }
        const values = row.values;
        const newValues = { ...values, [firstColumn.name]: createPrimaryValues(i, identifier) }

        const updatedRow = await Row.findByIdAndUpdate(row._id, { ...row.toObject(), values: newValues }, { new: true });

        i++;
    }
}

export const createPrimaryValues = (i: number, identifier: string) => {
    let leadingZeroes = ""
    if (i >= 100000) {
        leadingZeroes = ""
    } else if (i >= 10000) {
        leadingZeroes = "0"
    } else if (i >= 1000) {
        leadingZeroes = "00"
    } else if (i >= 100) {
        leadingZeroes = "000"
    } else if (i >= 10) {
        leadingZeroes = "0000"
    } else {
        leadingZeroes = "00000"
    }

    return `${identifier}-${leadingZeroes}${i}`;
}
export const setPrimaryColumns = async () => {
    const dataCollections = await DataCollection.find({});

    for (const dataCollection of dataCollections) {
        const columns = await Column.find({ dataCollection: dataCollection._id }).sort({ position: 1 });

        const firstColumn = columns.find((col: any) => {
            return true;
        })

        const newColumn = { ...firstColumn?.toObject(), primary: true };

        const updatedColumn = await Column.findByIdAndUpdate(newColumn._id, newColumn)
    }
}

const setAllDCsAsMain = async () => {
    const dataCollections = await DataCollection.find({});

    for (const dc of dataCollections) {
        const updatedDc = await DataCollection.findByIdAndUpdate(dc._id, { ...dc, main: true, belongsToAppModel: false, appModel: null, inParentToDisplay: null })
    }
}

const setUserWorkspaces = async () => {
    const users = await User.find({});
    for (const user of users) {
        const userWorkspaces = user.workspaces;
        for (const userWorkspace of userWorkspaces) {
            const userWorkspaceDoc = new UserWorkspace({
                userId: user._id,
                workspaceId: userWorkspace.id
            });
            userWorkspaceDoc.save();
        }
    }
}

export const cToF = (value: number) => {
    return ((value * (9 / 5)) + 32)
}

export const fToC = (value: number) => {
    return ((value - 32) * (5 / 9));
}

const setRowsToArchived = async () => {
    const rows = await Row.find({});

    for (const row of rows) {
        const updatedRow = await Row.findByIdAndUpdate(row?._id, { archived: false }, { new: true });
    }
}

const utility = async () => {
    const dataCollection = await DataCollection.findOne({ _id: "6750e04db9bb3fb62838500e" });
    const rows = await Row.find({ dataCollection: '6750e04db9bb3fb62838500e' });
    const columns = await Column.find({ dataCollection: '6750e04db9bb3fb62838500e' })

    for (const row of rows) {
        const newValues: any = {};

        for (const column of columns) {
            if (row.values[column.name] === "Label 1") {
                newValues[column.name] = "";
            } else {
                newValues[column.name] = row.values[column.name]
            }
        }

        const updatedRow = await Row.findByIdAndUpdate({ _id: row._id }, { values: newValues }, { new: true });
    }
}

export const helpersRunner = async () => {
    // const swiftSensorsAuth = new SwiftSensorsAPIAuth();
    // await swiftSensorsAuth.signin(workspaceIds[0], settings);

    // const integration = new SwiftSensorsIntegration();
    // await integration.syncAll();

    // const thresholdsInstance = await Threshold.initialize(workspaceIds[0]);
    // const thresholds = thresholdsInstance?.getData()
    // Threshold.setup(workspaceIds[0], thresholds, false);

    // setRowsToArchived()

    // utility()
}

