import { Request, Response } from "express";
import Cell from "../models/cell.models";
import User from "../models/auth.model";
import { io } from "../index";
import Notification from "../models/notification.model";
import Workspace from "../models/workspace.model";
import DataCollection from "../models/dataCollection.model";
import Row from "../models/row.models";
import mongoose, { ObjectId } from "mongoose";

export const updateCell = async (req: Request, res: Response) => {
    try {
        const cell = await Cell.findOne({_id: req.params.id});
        const workspace = await Workspace.findOne({_id: req.params.workspaceId});
        const dataCollection = await DataCollection.findOne({_id: req.params.dataCollectionId});
        console.log("VALUE", req.body.value);
        if (cell?.type === "people") {
            const user = await User.findOne({_id: req.body.value});
            const row = await Row.findOne({_id: cell?.row});

            if (row?.assignedTo) row.assignedTo = user?._id || "";

            row?.save();

            console.log(user?._id.toString())

            req.body.value = `${user?.firstname} ${user?.lastname}`
            io.emit(user?._id.toString() || "", {message: `You have been assigned a ${dataCollection?.name} assignment in ${workspace?.name}`, priority: "Low"});

            const notification = new Notification({
                message: `You have been assigned a ${dataCollection?.name} assignment in ${workspace?.name}`,
                workspaceId: workspace?._id,
                assignedTo: user?._id,
                priority: "Low",
            });

            notification.save();
        }

        let person;

        if (cell?.type === "priority") {
            const row = await Row.findOne({_id: cell?.row});
            const rowUser = await User.findOne({_id: row?.assignedTo});

            io.emit(rowUser?._id || "", {message: `Priority has changed from ${cell.value} to ${req.body.value} in your ${dataCollection?.name} assignment in ${workspace?.name}`, priority: req.body.value});

            const notification = new Notification({
                message: `Priority has changed from ${cell.value} to ${req.body.value} in your ${dataCollection?.name} assignment in ${workspace?.name}`,
                workspaceId: workspace?._id,
                assignedTo: rowUser?._id,
                priority: req.body.value,
            });

            notification.save();
        }

        if (cell?.type === "status") {
            
            const row = await Row.findOne({_id: cell?.row});
            const rowUser = await User.findOne({_id: row?.assignedTo});

            io.emit(rowUser?._id || "", {message: `Status has changed from ${cell.value} to ${req.body.value} in your ${dataCollection?.name} assignment in ${workspace?.name}`, priority: "Low"});

            const notification = new Notification({
                message: `Status has changed from ${cell.value} to ${req.body.value} in your ${dataCollection?.name} assignment in ${workspace?.name}`,
                workspaceId: workspace?._id,
                assignedTo: rowUser?._id,
                priority: "Low",
            })

            notification.save();

            for (const member of workspace?.members || []) {
                const workspaceMember = await User.findOne({email: member.email});

                io.emit(workspaceMember?._id || "", {message: `Status has changed from ${cell.value} to ${req.body.value} in your ${dataCollection?.name} assignment in ${workspace?.name}`, priority: "Low"});

                let memberNotification = new Notification({
                    message: `Status has changed from ${cell.value} to ${req.body.value} in your ${dataCollection?.name} assignment in ${workspace?.name}`,
                    workspaceId: workspace?._id,
                    assignedTo: workspaceMember?._id,
                    priority: "Low",
                })

                memberNotification.save();
            }

            
        }

        io.emit("update")

        const cellResponse = await Cell.findByIdAndUpdate(req.params.id, req.body);
        res.send(cellResponse);
    } catch (error) {
        res.status(400).send({success: false})
    }
}