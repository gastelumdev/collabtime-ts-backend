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

export const convertRowCells = async () => {
    const dataCollections = await DataCollection.find({ _id: "65c3c566290dd890c63ef4c9" });

    for (const dataCollection of dataCollections) {
        const rows = await Row.find({ dataCollection: dataCollection._id });


        for (let i = 0; i < rows.length; i++) {
            const row: any = await Row.findOne({ _id: rows[i]._id });
            row.position = i + 1;
            console.log(row.position);
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
                // console.log(cell);
                if (cell && cell.value) {
                    const value = cell.value === undefined ? "" : cell.value;
                    console.log(dataCollection._id, column.name, value)
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

        console.log(values)

        if (length < 50) {
            const numberOfMissingRows = 50 - 0;
            console.log({ numberOfMissingRows })

            for (let i = length + 1; i <= 50; i++) {
                const row = new Row({
                    dataCollection: dataCollection._id,
                    values: values,
                    position: i,
                })
                row.save();
                console.log(row)
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
        if (assignedToArr.length > 0) console.log(assignedToArr);

        row.values = { ...row.values, assigned_to: assignedToArr };

        const updatedRow = await Row.findByIdAndUpdate(row._id, { values: row.values }, { new: true });
        console.log((updatedRow as any).values);
    }

};

const checkForEmptyRows = async () => {
    const rows = await Row.find({}).sort({ position: 1 });



    for (const row of rows) {
        let isEmpty = true;
        console.log({ values: row.values })
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
        console.log(isEmpty)
        const updatedRow = await Row.findByIdAndUpdate(row._id, { isEmpty }, { new: true });
        console.log(updatedRow?.isEmpty)
    }
}



const createUserGroups = async () => {
    const workspaces = await Workspace.find({});

    // console.log(workspaces)

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

        // console.log(util.inspect(adminDataCollectionPermissionsResult, { showHidden: false, depth: null, colors: true }))

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

        // console.log(adminDataCollectionPermissionsResult[1].permissions.columns)
        // console.log(adminUserGroup.permissions.dataCollections[1].permissions.columns)

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

        // console.log(util.inspect(adminDataCollectionPermissionsResult, { showHidden: false, depth: null, colors: true }))

        // const views = await DataCollectionView.find({ workspace: workspace._id });

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

        // console.log(adminDataCollectionPermissionsResult[1].permissions.columns)
        // console.log(adminUserGroup.permissions.dataCollections[1].permissions.columns)

        noAccessUserGroup.save()

        console.log(noAccessUserGroup)
    }
}

const addPublic = async () => {
    const dataCollectionViews = await DataCollectionView.find({});

    for (const dcView of dataCollectionViews) {
        const newDcView = await DataCollectionView.findByIdAndUpdate(dcView._id, { ...dcView.toObject(), public: false });
        console.log(newDcView)
    }
}


const addLabelsToUserGroups = async () => {
    const userGroups = await UserGroup.find({});

    for (const userGroup of userGroups) {
        // console.log({ userGroup })
        const newViewsPermissions = []

        for (const viewsPermissions of userGroup.permissions.views) {
            // console.log({ viewsPermissions })
            const newColumnPermissions = []

            for (const columnPermissions of viewsPermissions.permissions.columns) {
                const column: any = await Column.findOne({ _id: columnPermissions.column });
                let labelsArray = [];
                if (['label', 'status'].includes(column?.type)) {
                    labelsArray = column.labels.map((item: any) => {
                        return item.title;
                    })

                    // console.log(labelsArray)
                } else {
                    labelsArray = []
                }

                // console.log({ ...columnPermissions, permissions: { ...columnPermissions.permissions, labels: labelsArray } })
                newColumnPermissions.push({ ...columnPermissions, permissions: { ...columnPermissions.permissions, labels: [...labelsArray] } })
            }

            // console.log(util.inspect({ ...viewsPermissions, permissions: { ...viewsPermissions.permissions, columns: newColumnPermissions } }, { showHidden: false, depth: null, colors: true }));
            newViewsPermissions.push({ ...viewsPermissions, permissions: { ...viewsPermissions.permissions, columns: newColumnPermissions } })
        }
        const newUserGroup = { ...userGroup.toObject(), permissions: { ...userGroup.toObject().permissions, views: newViewsPermissions } }
        console.log(util.inspect(newUserGroup, { showHidden: false, depth: null, colors: true }));

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
        console.log({ ...row, values: newValues })

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
        console.log(updatedColumn)
    }
}

const setAllDCsAsMain = async () => {
    const dataCollections = await DataCollection.find({});

    for (const dc of dataCollections) {
        const updatedDc = await DataCollection.findByIdAndUpdate(dc._id, { ...dc, main: true, belongsToAppModel: false, appModel: null, inParentToDisplay: null })
        console.log(updatedDc)
    }
}

export const helpersRunner = () => {
    // autoIncrementProjectNumber()
    // setAllDCsAsMain()
}