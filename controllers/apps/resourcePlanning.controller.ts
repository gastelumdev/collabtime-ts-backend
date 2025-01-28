import { Request, Response } from "express";
import Row from "../../models/row.models";
import DataCollectionView from "../../models/dataCollectionView.model";
import DataCollection from "../../models/dataCollection.model";
import Column from "../../models/column.model";
import { TRow } from "../../types";
import { IRow } from "../../services/row.service";

export const getProject = async (req: Request, res: Response) => {
    try {
        const project = await Row.findOne({ _id: req.params.rowId });

        res.send(project);
    } catch (error) {
        res.status(400).send({ success: false });
    }
}

export const getBillOfMaterialsView = async (req: Request, res: Response) => {
    const view = await DataCollectionView.findOne({ workspace: req.params.workspaceId, name: 'Bill of Materials' });
    res.send(view)
}

export const getBillOfMaterialsParts = async (req: Request, res: Response) => {
    const projectId = req.params.projectId;
    const view = await DataCollectionView.findOne({ workspace: req.params.workspaceId, name: 'Bill of Materials' });
    const parts = await Row.find({ dataCollection: view?.dataCollection, isEmpty: false });

    const response = parts.filter((item) => {
        return item.values.project_id === projectId
    })

    console.log({ response })

    res.send(response);
}

export const getParts = async (req: Request, res: Response) => {
    const partsDataCollection = await DataCollection.findOne({ workspace: req.params.workspaceId, name: 'Parts' })
    const parts = await Row.find({ dataCollection: partsDataCollection?._id })

    res.send(parts)
}

export const getPartsColumns = async (req: Request, res: Response) => {
    const partsDataCollection = await DataCollection.findOne({ workspace: req.params.workspaceId, name: 'Parts' });
    const partsColumns = await Column.find({ dataCollection: partsDataCollection?._id }).sort({ position: 1 });

    res.send(partsColumns)
}

export const updateBillOfMaterialPartValues = async (req: Request, res: Response) => {
    const newRowValues = req.body.values;
    const newRowRefs = req.body.refs;
    let rowToUpdate;

    const view = await DataCollectionView.findOne({ workspace: req.params.workspaceId, name: 'Bill of Materials' });
    const bomParts = await Row.find({ dataCollection: view?.dataCollection, isEmpty: false });

    const existingBomPart = bomParts?.find((item: any) => {
        return item.values['Part No'] === newRowValues['Part No'];
    })

    if (existingBomPart !== undefined) {
        rowToUpdate = existingBomPart;
    } else {
        rowToUpdate = await Row.findOne({ dataCollection: view?.dataCollection, isEmpty: true }).sort({ position: 1 });
    }

    const newBomPart = await Row.findByIdAndUpdate(rowToUpdate?._id, { values: newRowValues, refs: { ...rowToUpdate?.refs, ...newRowRefs }, isEmpty: false }, { new: true });
    console.log(newBomPart);

    res.send(newBomPart);
}