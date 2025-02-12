import { Request, Response } from "express";
import Row from "../../models/row.models";
import Column from "../../models/column.model";

export const getPlannerTasks = async (req: Request, res: Response) => {
    try {
        let response: any = []
        const plannerTasks = await Row.find({ dataCollection: req.params.dataCollectionId });

        for (const plannerTask of plannerTasks) {
            if (plannerTask.values['row_id'] === req.query.rowId) {
                response.push(plannerTask)
            }
        }
        res.send(response)
    } catch (error) {
        res.status(400).send(error)
    }
}

export const getPlannerBucketColumn = async (req: Request, res: Response) => {
    try {
        const column = await Column.findOne({ dataCollection: req.params.dataCollectionId, name: 'bucket' })

        console.log({ column })

        res.send(column);
    } catch (error) {
        res.status(400).send(error)
    }
}