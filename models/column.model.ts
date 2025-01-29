import mongoose, { Schema, Types, model } from "mongoose";
import { IColumn, IColumnDocument, IColumnModel } from "../services/column.service";

const columnSchema: Schema<IColumnDocument> = new Schema({
    dataCollection: { type: Schema.Types.ObjectId },
    name: { type: String },
    type: { type: String, defualt: "text" },
    position: { type: Number },
    width: { type: String },
    permanent: { type: Boolean },
    people: { type: [] },
    labels: { type: [] },
    dataCollectionRef: { type: {} },
    dataCollectionRefLabel: { type: String },
    includeInForm: { type: Boolean },
    includeInExport: { type: Boolean },
    autoIncremented: { type: Boolean },
    autoIncrementPrefix: { type: String },
    primary: { type: Boolean },
    createdAt: { type: Date, default: Date.now },
    prefix: { type: String, default: null }
}, {
    timestamps: true,
});

columnSchema.statics.buildColumn = (args: IColumn) => {
    return new Column(args);
};

const Column = model<IColumnDocument, IColumnModel>("columns", columnSchema);

export default Column;