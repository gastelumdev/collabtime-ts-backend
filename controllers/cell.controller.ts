import { Request, Response } from "express";
import Cell from "../models/cell.models";
import User from "../models/auth.model";
import { io } from "../index";
import Notification from "../models/notification.model";
import Workspace from "../models/workspace.model";
import DataCollection from "../models/dataCollection.model";

export const updateCell = async (req: Request, res: Response) => {
    try {
        const cell = await Cell.findOne({_id: req.params.id});
        const workspace = await Workspace.findOne({_id: req.params.workspaceId});
        const dataCollection = await DataCollection.findOne({_id: req.params.dataCollectionId});
        console.log("VALUE", req.body.value);
        if (cell?.type === "people") {
            const user = await User.findOne({_id: req.body.value});
            req.body.value = `${user?.firstname} ${user?.lastname}`
            io.emit(user?._id || "", `You have been assigned a ${dataCollection?.name} assignment in ${workspace?.name}`);

            const notification = new Notification({
                message: `You have been assigned a ${dataCollection?.name} assignment in ${workspace?.name}`,
                workspaceId: workspace?._id,
                assignedTo: user?._id,
                priority: "Low",
            });

            notification.save();
        }

        const cellResponse = await Cell.findByIdAndUpdate(req.params.id, req.body);
        res.send(cellResponse);
    } catch (error) {
        res.status(400).send({success: false})
    }
}