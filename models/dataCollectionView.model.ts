import { model, Schema } from "mongoose";
import { IDataCollectionView, IDataCollectionViewDocument, IDataCollectionViewModel } from "../services/dataCollectionView.service";

const dataCollectionViewSchema: Schema<IDataCollectionViewDocument> = new Schema({
    name: { type: String, required: true },
    description: { type: String },
    workspace: { type: Schema.Types.ObjectId },
    dataCollection: { type: Schema.Types.ObjectId },
    row: { type: Schema.Types.ObjectId, default: null },
    columns: { type: [] },
    viewers: { type: [] },
    filters: { type: {} },
    public: { type: Schema.Types.Boolean, default: false },
    belongsToRow: { type: Schema.Types.Boolean, default: false },
    rowsOfDataCollection: { type: Schema.Types.ObjectId, default: null },
    main: { type: Schema.Types.Boolean, default: false },
    maxNumberOfItems: { type: Number, default: null },
    createdAt: { type: Date, default: Date.now },
    position: { type: Number },
}, {
    timestamps: true
});

dataCollectionViewSchema.statics.buildDataCollectionView = (args: IDataCollectionView) => {
    return new DataCollectionView(args);
};

const DataCollectionView = model<IDataCollectionViewDocument, IDataCollectionViewModel>("dataCollectionViews", dataCollectionViewSchema);

export default DataCollectionView;