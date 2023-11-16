import mongoose, {Schema, Types, model} from "mongoose";
import { ICell, ICellDocument, ICellModel } from "../services/cell.service";

const cellSchema: Schema<ICellDocument> = new Schema({
    dataCollection: {type: Schema.Types.ObjectId},
    row: {type: Schema.Types.ObjectId},
    name: {type: String, required: true},
    type: {type: String},
    labels: {type: []},
    people: {type: []},
    value: {type: String},
    createdAt: {type: Date, default: Date.now},
}, {
    timestamps: true
});

cellSchema.statics.buildCell = (args: ICell) => {
    return new Cell(args);
};

const Cell = model<ICellDocument, ICellModel>("cells", cellSchema);

export default Cell;