import mongoose, { Schema, Types, model } from "mongoose";
import { IRow, IRowDocument, IRowModel } from "../services/row.service";

const rowSchema: Schema<IRowDocument> = new Schema({
    dataCollection: { type: Schema.Types.ObjectId },
    cells: { type: [], default: [] },
    assignedTo: { type: Schema.Types.ObjectId, default: null },
    createdBy: { type: Schema.Types.ObjectId, default: null },
    notes: { type: String, default: "" },
    notesList: { type: [], default: [] },
    createdAt: { type: Date, default: Date.now },
    tags: { type: [], default: [] },
    reminder: { type: Boolean, default: true },
    complete: { type: Boolean, default: false },
    acknowledged: { type: Boolean, default: false },
    values: { type: {} },
    position: { type: Number },
    docs: { type: [], default: [] },
    isParent: { type: Boolean, default: false },
    parentRowId: { type: Schema.Types.ObjectId, default: null },
    showSubrows: { type: Boolean, default: true },
    isVisible: { type: Boolean, default: true },
}, {
    timestamps: true
});

rowSchema.statics.buildRow = (args: IRow) => {
    return new Row(args);
};

const Row = model<IRowDocument, IRowModel>("rows", rowSchema);

export default Row;