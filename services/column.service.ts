import { Document, Schema, Model } from "mongoose";
import User from "../models/auth.model";
import Column from "../models/column.model";
import DataCollection from "../models/dataCollection.model";
import Row from "../models/row.models";
import { IWorkspace } from "./workspace.service";
import { IDataCollection } from "./dataCollection.service";
import { IRow } from "./row.service";
import { deleteUserColumn, updateUserColumn } from "./userColumn.service";
import { IUser } from "./auth.service";
import Logger from '../utils/logger/Logger';

const logger = new Logger()

export type TLabel = {
    users: string[];
    title: string;
    color: string;
    default: boolean;
};

export interface IColumn {
    dataCollection: Schema.Types.ObjectId;
    name: string;
    type: "text" | "number" | "date" | "people" | "reference" | "label" | "priority" | "status";
    position: number;
    width: string;
    permanent: boolean;
    people?: string[];
    labels?: TLabel[];
    dataCollectionRef?: any;
    dataCollectionRefLabel?: any;
    includeInForm: boolean;
    includeInExport: boolean;
    autoIncremented: boolean;
    autoIncrementPrefix: string;
    primary: boolean;
    createdAt: Date;
    prefix?: string | null;
    isEmpty?: boolean;
}

export interface IColumnDocument extends IColumn, Document { }

export interface IColumnModel extends Model<IColumnDocument> {
    buildColumn(args: IColumn): IColumnDocument;
}

export const setupColumn = async (workspace: IWorkspace & { _id: string }, dataCollection: IDataCollection & { _id: string }, reqbody: IColumn & { _id: string }, columnsLength: number, rows: (IRow & { _id: string })[]) => {
    const people: any = []

    for (const member of workspace?.members || []) {
        let person = await User.findOne({ email: member.email });
        people.push(person);
    }



    const column = { ...(reqbody), people: people };
    // column.position = columnsLength + 1
    let value = null;

    console.log(column)

    if (column.type === "text" || column.type === "number") value = ""
    if (column.type === "label" || column.type === "priority" || column.type === 'status') {
        const label: any = column.labels?.find((item: TLabel) => {
            return item.default;
        });
        value = label.title;
    }
    if (column.type === "people") value = [];
    if (column.type === "date") value = "";
    if (column.type === "reference") {

        const dataCollectionForRef = await DataCollection.findOne({ _id: reqbody.dataCollectionRef });
        const dataCollectionRef = await DataCollection.findOne({ workspace: workspace._id, name: dataCollectionForRef?.name });
        column.dataCollectionRef = dataCollectionRef
    }

    for (const row of rows) {
        const values = { ...row.values, [column.name]: value };
        const updatedRow = await Row.findByIdAndUpdate(row._id, { values: values }, { new: true });
    }

    // column.save()
    const updatedColumn = await Column.findByIdAndUpdate(reqbody._id, column, { new: true })

    logger.info(`${column.name} column has been created`)
    return updatedColumn;
}

export const editColumn = async (prevColumn: IColumn, newColumn: IColumn, dataCollectionId: string, columnId: string, user: IUser) => {
    const defaultValue = newColumn.labels?.find((item: TLabel) => {
        return item.default;
    })?.title;
    if (prevColumn.name !== newColumn.name) {
        const rows = await Row.find({ dataCollection: dataCollectionId });

        for (const row of rows) {

            const values = row.values;

            let value = values[prevColumn.name];
            if (value !== undefined) {

                if (row.isEmpty && ['label', 'priority', 'status'].includes(prevColumn.type) && value !== defaultValue) {
                    value = defaultValue;
                }

                values[newColumn.name] = value;
                delete values[prevColumn.name];

                const updatedRow = await Row.findByIdAndUpdate(row._id, { ...row, values }, { new: true });
            }
        }
    } else {
        const rows = await Row.find({ dataCollection: dataCollectionId });

        for (const row of rows) {
            let value = row.values[prevColumn.name];

            if (row.isEmpty && ['label', 'priority', 'status'].includes(prevColumn.type) && value !== defaultValue) {
                value = defaultValue;
            }
            const updatedRow = await Row.findByIdAndUpdate(row._id, { values: { ...row.values, [prevColumn.name]: value } }, { new: true });
        }
    }

    const updatedColumn = await Column.findByIdAndUpdate(columnId, { ...newColumn, _id: columnId, dataCollection: dataCollectionId }, { new: true });

    const dataCollection = await DataCollection.findOne({ _id: dataCollectionId });
    updateUserColumn(user, null, dataCollection);
    return updatedColumn;
}

export const removeColumn = async (reqbody: IColumn & { _id: string }, dataCollectionId: string, user: IUser) => {
    const column = await Column.findOne({ name: reqbody.name, dataCollection: dataCollectionId });
    const name: any = column?.name;
    const columns = await Column.find({ dataCollection: column?.dataCollection }).sort({ position: 1 });

    const rows = await Row.find({ dataCollection: dataCollectionId });

    for (const row of rows) {
        // const rowCopy: any = await Row.findOne({ _id: row._id });
        const rowCopy: any = row;
        let values = rowCopy.values;
        let refs = rowCopy.refs;

        const newValues: any = {};
        const newRefs: any = {};

        for (const col of columns) {
            if (col.name !== column?.name) {
                if (values[col.name] !== undefined) {
                    newValues[col.name] = values[col.name];
                }

                if (refs[col.name] !== undefined) {
                    newRefs[col.name] = refs[col.name];
                }
            }
        }

        const updatedRow = await Row.findByIdAndUpdate(row._id, { values: newValues, refs: newRefs }, { new: true });
    }

    let position = 1;
    const columnsLength = columns.length;

    for (const col of columns) {
        if (column?._id.toString() !== col._id.toString() && position !== 40) {
            let newColumn = { ...col, position };

            const updatedColumn = await Column.findByIdAndUpdate(col._id, { position: newColumn.position });
            position = position + 1;
        } else {
            let newColumn = {
                name: `Column number ${position}`,
                position: 40,
                width: '180px',
                people: [],
                labels: [],
                dataCollectionRef: {},
                dataCollectionRefLabel: '',
                includeInForm: true,
                includeInExport: true,
                autoIncremented: false,
                autoIncrementPrefix: '',
                primary: false,
                prefix: null,
                isEmpty: true
            }
            const updatedColumn = await Column.findByIdAndUpdate(column?._id, newColumn, { new: true });
        }

    }

    // await Column.findByIdAndDelete(column?._id);

    const dataCollection = await DataCollection.findOne({ _id: column?.dataCollection });
    await deleteUserColumn(user, null, dataCollection);

    logger.info(`${name} column has been deleted`)
}