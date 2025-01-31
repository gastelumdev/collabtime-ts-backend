import mongoose, { Schema, Types, model } from "mongoose";
import { IColumn, IColumnDocument, IColumnModel } from "../services/column.service";

const columnSchema: Schema<IColumnDocument> = new Schema({
    dataCollection: { type: Schema.Types.ObjectId },
    name: { type: String },
    type: { type: String, default: "text" },
    position: { type: Number },
    width: { type: String, default: '180px' },
    permanent: { type: Boolean, default: false },
    people: { type: [], default: [] },
    labels: { type: [], default: [] },
    dataCollectionRef: { type: {} },
    dataCollectionRefLabel: { type: String },
    includeInForm: { type: Boolean, default: true },
    includeInExport: { type: Boolean, default: true },
    autoIncremented: { type: Boolean, default: false },
    autoIncrementPrefix: { type: String, default: '' },
    primary: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    prefix: { type: String, default: null },
    isEmpty: { type: Boolean, default: false }
}, {
    timestamps: true,
});

columnSchema.statics.buildColumn = (args: IColumn) => {
    return new Column(args);
};

const Column = model<IColumnDocument, IColumnModel>("columns", columnSchema);

export default Column;