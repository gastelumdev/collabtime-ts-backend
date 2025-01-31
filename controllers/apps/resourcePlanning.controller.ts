import { Request, Response } from "express";
import Row from "../../models/row.models";
import DataCollectionView from "../../models/dataCollectionView.model";
import DataCollection from "../../models/dataCollection.model";
import Column from "../../models/column.model";
import { TRow } from "../../types";
import { IRow } from "../../services/row.service";
import Workspace from "../../models/workspace.model";
import { generatePurchaseOrderPDF } from "../../services/apps/resourcePlanning.service";

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

    res.send(newBomPart);
}

export const purchaseOrder = async (req: Request, res: Response) => {
    const { workspaceId, vendorName, projectId } = req.params;

    const project = await Row.findOne({ _id: projectId });
    const bomDataCollection = await DataCollection.findOne({ workspace: workspaceId, name: 'Bill of Materials Parts' });
    const bomParts = await Row.find({ dataCollection: bomDataCollection?._id, isEmpty: false })

    const items = []

    for (const bomPart of bomParts) {
        const vendor = bomPart.refs.vendor[0];
        if (vendor.values.Name === vendorName) {
            items.push({ qty: Number(bomPart.values.qty), description: `${bomPart.values['Part No']} - ${bomPart.values.description}`, unitPrice: Number(bomPart.values.unit_price) });
        }
    }

    generatePurchaseOrderPDF(res, {
        number: 'EA10013',
        date: '11/6/2024',
        logo: 'ea-logo.png',
        salesPerson: 'Kristin Benda',
        companyAddress: { line1: '5351 Alhambra Ave.', line2: 'Los Angeles, CA 90032', line3: '(323) 332-2125' },
        toAddress: { companyName: vendorName, address: { line1: '2301 Patriot Blvd.', line2: 'Glenview, IL 60026-8020', line3: 'Phone' } },
        shipToAddress: { companyName: 'Environmental Automation', attn: 'Carlos Torres', address: { line1: '5351 Alhambra Ave.', line2: 'Los Angeles, CA 90032', line3: '(323) 332-2125' } },
        comments: 'Comments sample',
        requisitioner: 'Carlos Torres',
        shippedVia: 'UPS 3-Day',
        jobNumber: project?.values.job_number,
        quoteNumber: 'Q00D76J1',
        customerNumber: '525823',
        // items: [
        //     { qty: 2, description: '10277636 AXIS COMM 02374-001 M3086- V INDOOR FIXED MINI DOME4 MP', unitPrice: 358.05 },
        //     { qty: 3, description: '10277636 AXIS COMM 02374-001 M3086- V INDOOR FIXED MINI DOME4 MP', unitPrice: 358.05 }
        // ],
        items,
        salesTax: 34.01,
        shippingAndHandling: 30
    })

    // res.send('Purchase order generated');
}