import mongoose, {Schema, Types, model} from "mongoose";
import { IRow, IRowDocument, IRowModel } from "../services/row.service";

const rowSchema: Schema<IRowDocument> = new Schema({
    dataCollection: {type: Schema.Types.ObjectId},
    cells: {type: []},
    assignedTo: {type: Schema.Types.ObjectId},
    notes: {type: String},
    notesList: {type: []},
    createdAt: {type: Date, default: Date.now},
    tags: {type: []}
},{
    timestamps: true
});

rowSchema.statics.buildRow = (args: IRow) => {
    return new Row(args);
};

const Row = model<IRowDocument, IRowModel>("rows", rowSchema);

export default Row;