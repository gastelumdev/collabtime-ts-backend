import Column from "../models/column.model";
import Row from "../models/row.models";
import { IRow } from "../services/row.service";

export const checkIfLastRow = async (row: any) => {
    const rows = await Row.find({ dataCollection: row.dataCollection }).sort({ position: 1 });

    // if the id of the last row in the list is the same as the row being passed in
    // return true else return false
    if (rows[rows.length - 1]._id.toString() === row._id.toString()) {
        return true;
    }
    return false;
}

export const addBlankRows = async (dataCollection: any, user: any, count: number, lastRowPosition: number) => {
    const columns = await Column.find({ dataCollection: dataCollection?._id })

    // This object will contain all the columns as keys with empty values
    const emptyRowValues: any = {};
    for (const column of columns) {
        emptyRowValues[column.name] = "";
    }

    const newRows = []
    for (let i = 1; i <= count; i++) {
        // console.log({ i, count })
        lastRowPosition = lastRowPosition + 1;
        const newRow = new Row({
            dataCollection: dataCollection?._id,
            position: lastRowPosition,
            values: emptyRowValues,
            createdBy: user?._id
        })

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