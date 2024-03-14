import Column from "../models/column.model";
import Row from "../models/row.models";

export const checkIfLastRow = async (row: any) => {
    const rows = await Row.find({ dataCollection: row.dataCollection }).sort({ position: 1 });
    console.log(rows[rows.length - 1]._id.toString(), row._id.toString())
    if (rows[rows.length - 1]._id.toString() === row._id.toString()) {
        return true;
    }
    return false;
}

export const addBlankRows = async (row: any, dataCollection: any, user: any, count: number) => {
    const columns = await Column.find({ dataCollection: dataCollection?._id })

    const emptyRowValues: any = {};

    for (const column of columns) {
        emptyRowValues[column.name] = "";
    }

    const lastRowValues = row?.values;
    let lastRowPosition: any = row?.position;

    let numberOfValues = 0;

    for (const key in lastRowValues) {
        console.log({ values: lastRowValues[key] })
        if (lastRowValues[key] !== '') {
            numberOfValues++;
        }
    }

    const newRows = []

    if (numberOfValues >= 1) {
        for (let i = 1; i <= count; i++) {
            console.log({ i })
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
    }

    return newRows;
}