import Column from "../models/column.model";
import Row from "../models/row.models";
import { IRow } from "../services/row.service";
import { createPrimaryValues } from "./helpers";

export const rowsAreLessThanNumber = async (row: any, value: number = 10) => {
    const rows = await Row.find({ dataCollection: row.dataCollection, isEmpty: true });
    // console.log({ rows })

    // if the id of the last row in the list is the same as the row being passed in
    // return true else return false
    if (rows.length <= value) {
        return true;
    }
    return false;
}

export const addBlankRows = async (dataCollection: any, user: any, count: number, lastRowPosition: number, lastRow: any) => {
    const columns = await Column.find({ dataCollection: dataCollection?._id });
    const rows = await Row.find({ dataCollection: dataCollection._id }).sort({ position: 1 });
    // const lastRow = rows[rows.length - 1];

    lastRowPosition = lastRow.position;

    let suffixValue = 0;
    const newRows = []
    for (let i = 1; i <= count; i++) {
        console.log({ i })
        // This object will contain all the columns as keys with empty values
        const emptyRowValues: any = {};

        if (i !== 1) {
            suffixValue = suffixValue + 1;
        }

        for (const column of columns) {
            if (suffixValue === 0) {
                if (lastRow.values !== undefined) {
                    suffixValue = Number(lastRow.values[column.name].split("-")[1]) + 1;
                }

            }



            if (column.autoIncremented) {
                emptyRowValues[column.name] = createPrimaryValues(suffixValue, column.autoIncrementPrefix);
            }



            if (column.type === 'label') {
                let defaultLabelValue = '';
                for (const label of column.labels as any) {
                    if (label.default !== undefined && label.default) {
                        defaultLabelValue = label.title;
                    }
                }
                emptyRowValues[column.name] = defaultLabelValue;
            }
        }
        lastRowPosition = lastRowPosition + 1024;
        const newRow = new Row({
            dataCollection: dataCollection?._id,
            position: lastRowPosition,
            values: emptyRowValues,
            createdBy: user?._id
        })

        console.log({ newRow })

        newRows.push(newRow)
        newRow.save();
    }

    return newRows;
}

/**
 * 
 * @param row 
 * @returns {boolean}
 * 
 * Function goes through each value of a row and returns false if there is a value that is not empty.
 */
export const rowIsEmpty = (row: IRow) => {
    let isEmpty: boolean = true;
    const values: any = row.values;

    for (const key in values) {
        if (row.values[key] !== "") {
            isEmpty = false;
        }
    }

    return isEmpty;
}

/**
 * 
 * @param rows 
 * @returns {IRow}
 * 
 * Function goes though all the rows and returns the last non empty row
 */
export const lastNonEmptyRow = (rows: IRow[]) => {
    let targetRow: IRow | null = null;

    for (const currentRow of rows) {
        if (!rowIsEmpty(currentRow)) {
            targetRow = currentRow;
        }
    }

    return targetRow;
}