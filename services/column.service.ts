import { Document, Schema, Model } from "mongoose";
import User from "../models/auth.model";
import Column from "../models/column.model";
import DataCollection from "../models/dataCollection.model";
import Row from "../models/row.models";
import { IWorkspace } from "./workspace.service";
import { IDataCollection } from "./dataCollection.service";
import { IRow } from "./row.service";

export type TLabel = {
    users: string[];
    title: string;
    color: string;
    default: boolean;
};

export interface IColumn {
    dataCollection: Schema.Types.ObjectId;
    name: string;
    type: string;
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
}

export interface IColumnDocument extends IColumn, Document { }

export interface IColumnModel extends Model<IColumnDocument> {
    buildColumn(args: IColumn): IColumnDocument;
}

export const setupColumn = async (workspace: IWorkspace & { _id: string }, dataCollection: IDataCollection & { _id: string }, reqbody: IColumn, columnsLength: number, rows: (IRow & { _id: string })[]) => {
    const people: any = []

    for (const member of workspace?.members || []) {
        let person = await User.findOne({ email: member.email });
        people.push(person);
    }

    const column = new Column({ ...(reqbody), dataCollection: dataCollection?._id, people: people });
    column.position = columnsLength + 1
    let value = null;

    if (column.type === "text") value = ""
    if (column.type === "label" || column.type === "priority" || column.type === 'status') {
        const label: any = column.labels?.find((item: TLabel) => {
            return item.default;
        });
        value = label.title;
    }
    if (column.type === "people") value = [];
    if (column.type === "date") value = (new Date()).toISOString();
    if (column.type === "reference") {
        const dataCollectionRef = await DataCollection.findOne({ _id: reqbody.dataCollectionRef });
        column.dataCollectionRef = dataCollectionRef
    }

    for (const row of rows) {
        const values = { ...row.values, [column.name]: value };
        const updatedRow = await Row.findByIdAndUpdate(row._id, { values: values }, { new: true });
    }

    column.save()

    return column;
}

export const editColumn = async (prevColumn: IColumn, newColumn: IColumn, dataCollectionId: string, columnId: string) => {
    const defaultValue = newColumn.labels?.find((item: TLabel) => {
        return item.default;
    })?.title;
    if (prevColumn.name !== newColumn.name) {
        const rows = await Row.find({ dataCollection: dataCollectionId });

        for (const row of rows) {

            const values = row.values;

            let value = values[prevColumn.name];
            if (value !== undefined) {

                if (row.isEmpty && value !== defaultValue) {
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

            if (row.isEmpty && value !== defaultValue) {
                value = defaultValue;
                const updatedRow = await Row.findByIdAndUpdate(row._id, { values: { ...row.values, [prevColumn.name]: value } }, { new: true });
            }


        }
    }


    const updatedColumn = await Column.findByIdAndUpdate(columnId, { ...newColumn, _id: columnId, dataCollection: dataCollectionId }, { new: true });
    return updatedColumn;
}

export const removeColumn = async (reqbody: IColumn & { _id: string }, dataCollectionId: string) => {
    const column = await Column.findOne({ name: reqbody.name, dataCollection: dataCollectionId });
    const name: any = column?.name;
    const dataCollection = column?.dataCollection;

    await Column.findByIdAndDelete(column?._id);

    const rows = await Row.find({ dataCollection: dataCollectionId });

    const rowsWithValues = rows.filter((row) => {
        return (row.values[name] !== undefined || row.refs[name] !== undefined) && (row.values[name] !== "");
    });

    for (const row of rowsWithValues) {
        // const rowCopy: any = await Row.findOne({ _id: row._id });
        const rowCopy: any = row;
        let values = rowCopy.values;
        let refs = rowCopy.refs;
        delete values[name];
        rowCopy.values = values;

        let newRefs = {};

        if (refs !== undefined) {
            const refsKeys = Object.keys(refs);

            for (const key of refsKeys) {
                if (key !== column?.name) {
                    newRefs = { ...newRefs, [column?.name as any]: refs[column?.name as any] };
                }
            }
        }
        rowCopy.refs = newRefs;
        await Row.findByIdAndUpdate(row._id, { $set: { values: rowCopy.values, refs: rowCopy.refs } }, { new: true });

    }

    const columns = await Column.find({ dataCollection: dataCollection }).sort({ position: 1 });
    let position = 1;

    for (const column of columns) {
        let newColumn = { ...column, position };

        const updatedColumn = await Column.findByIdAndUpdate(column._id, { position: newColumn.position });
        position = position + 1;
    }
}