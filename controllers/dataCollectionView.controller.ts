import { Request, Response } from "express";
import DataCollectionView from "../models/dataCollectionView.model";
import Column from "../models/column.model";
import mongoose from "mongoose";

export const getDataCollectionViews = async (req: Request, res: Response) => {
    try {
        const dataCollectionViews = await DataCollectionView.find({ workspace: req?.params.workspaceId });
        const response: any = [];

        console.log(dataCollectionViews)

        for (const dataCollectionView of dataCollectionViews) {
            const dataCollectionViewCopy = dataCollectionView;
            const columns: any = []
            for (const column of dataCollectionView.columns) {
                const col = await Column.findById({ _id: column._id });
                columns.push(col);
            }
            dataCollectionViewCopy.columns = columns;

            if (dataCollectionViewCopy.viewers.includes((<any>req).user._id)) {
                response.push(dataCollectionViewCopy);
            }

        }

        console.log({ response })

        res.send(response);
    } catch (err) {
        res.status(400).send({ success: false })
    }
}

export const createDataCollectionView = async (req: Request, res: Response) => {
    try {
        const dataCollectionView = req.body;

        const newDataCollectionView = new DataCollectionView(dataCollectionView)

        newDataCollectionView.save();

        res.send(newDataCollectionView);
    } catch (err) {
        res.status(400).send({ success: false })
    }
}

export const updateDataCollectionView = async (req: Request, res: Response) => {
    try {

        const dataCollectionView = req.body;

        await DataCollectionView.findByIdAndUpdate({ _id: dataCollectionView._id }, { ...dataCollectionView }, { new: true });

        res.send({ success: true });
    }
    catch (err) {
        res.status(400).send({ success: false });
    }
}

export const deleteDataCollectionView = async (req: Request, res: Response) => {
    try {
        const dataCollectionViewId = new mongoose.Types.ObjectId(req?.params.dataCollectionViewId);

        await DataCollectionView.findByIdAndDelete(dataCollectionViewId)

        res.send({ success: true });
    } catch (err) {
        res.status(400).send({ success: true })
    }
}