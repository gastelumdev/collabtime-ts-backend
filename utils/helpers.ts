import Cell from "../models/cell.models";
import Column from "../models/column.model";
import DataCollection from "../models/dataCollection.model";
import Row from "../models/row.models";

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