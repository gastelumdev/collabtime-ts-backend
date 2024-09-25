import { model, Schema } from "mongoose";
import { IDataCollectionView, IDataCollectionViewDocument, IDataCollectionViewModel } from "../services/dataCollectionView.service";

const dataCollectionViewSchema: Schema<IDataCollectionViewDocument> = new Schema({
    name: { type: String, required: true },
    description: { type: String },
    workspace: { type: Schema.Types.ObjectId },
    dataCollection: { type: Schema.Types.ObjectId },
    columns: { type: [] },
    viewers: { type: [] },
    createdAt: { type: Date, default: Date.now },
}, {
    timestamps: true
});

dataCollectionViewSchema.statics.buildDataCollectionView = (args: IDataCollectionView) => {
    return new DataCollectionView(args);
};

const DataCollectionView = model<IDataCollectionViewDocument, IDataCollectionViewModel>("dataCollectionViews", dataCollectionViewSchema);

export default DataCollectionView;