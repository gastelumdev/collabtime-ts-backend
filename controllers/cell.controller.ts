import { Request, Response } from "express";
import Cell from "../models/cell.models";
import User from "../models/auth.model";
import { io } from "../index";
import Notification from "../models/notification.model";
import Workspace from "../models/workspace.model";
import DataCollection from "../models/dataCollection.model";
import Row from "../models/row.models";
import mongoose, { ObjectId } from "mongoose";
import sendEmail from "../utils/sendEmail";
import { ICell } from "../services/cell.service";
import { IWorkspace } from "../services/workspace.service";
import { IDataCollection } from "../services/dataCollection.service";

export const updateCell = async (req: Request, res: Response) => {
    try {
        const cell = await Cell.findOne({ _id: req.params.id });
        const workspace = await Workspace.findOne({ _id: req.params.workspaceId });
        const dataCollection = await DataCollection.findOne({ _id: req.params.dataCollectionId });
        const initiator = await User.findOne({ _id: (<any>req).user._id });

        let recipients = [];
        for (const member of workspace?.members || []) {
            recipients.push(member.email);
        }


        if (cell?.type === "people") {

            const user = await User.findOne({ _id: req.body.value });

            const row = await Row.findOne({ _id: cell?.row });
            // const creator = await User.findOne({_id: row?.createdAt});

            // if (row?.assignedTo) row.assignedTo = user?._id || "";

            row?.save();

            req.body.value = `${user?.firstname} ${user?.lastname}`;
            io.emit(user?._id.toString() || "", { message: `You have been assigned a ${dataCollection?.name} assignment in ${workspace?.name}`, priority: "Low" });

            const notification = new Notification({
                message: `You have been assigned a ${dataCollection?.name} assignment in ${workspace?.name}`,
                workspaceId: workspace?._id,
                assignedTo: user?._id,
                priority: "Low",
            });

            notification.save();

            sendEmail({
                email: user?.email || "",
                subject: `New Assignment in ${workspace?.name} - ${dataCollection?.name}`,
                payload: {
                    dataCollectionName: dataCollection?.name,
                    message: `Hi ${user?.firstname}, you have been assigned a ${dataCollection?.name} task.`,
                    link: `${process.env.CLIENT_URL || "http://localhost:5173"}/workspaces/${workspace?._id}/dataCollections/${dataCollection?._id}`
                },
                template: "./template/dataCollectionStatusChange.handlebars",
                res: res
            }, (res: Response) => {
            })
        }

        if (cell?.type === "priority") {
            const enableEmail = false;
            const message = `Priority has changed from ${cell.value} to ${req.body.value} in ${dataCollection?.name}- ${workspace?.name}`
            const emailSubject = `Priority change in ${workspace?.name} - ${dataCollection?.name}`
            notifyUsers({ cell, workspace, dataCollection, recipients, req, res, message, emailSubject, enableEmail });
        }

        if (cell?.type === "status") {
            const row = await Row.findOne({ _id: cell?.row });
            const creator = await User.findOne({ _id: row?.createdBy })

            let enableEmail = false;
            let taskName = "";

            if (req.body.value === "Done") {
                const row = await Row.findOne({ _id: cell.row });
                if (row) row.complete = true;
                row?.save()



                for (const rowCellId of row?.cells || []) {
                    const rowCell = await Cell.findOne({ _id: rowCellId });

                    if (rowCell?.name === "task") {
                        enableEmail = true;
                        taskName = rowCell.value;
                    }
                }
            }

            const message = `${workspace?.name} - ${dataCollection?.name} task ${taskName} has been completed. `;
            const emailSubject = `Status change in ${workspace?.name} - ${dataCollection?.name}`;

            notifyUsers({ cell, workspace, dataCollection, recipients: [creator?.email || ""], req, res, message, emailSubject, enableEmail });
        }

        if (cell?.type === "label") {
            const enableEmail = false;
            const message = `Label has changed from ${cell.value} to ${req.body.value} in ${dataCollection?.name} - ${workspace?.name}`
            const emailSubject = `Label change in ${workspace?.name} - ${dataCollection?.name}`;
            notifyUsers({ cell, workspace, dataCollection, recipients, req, res, message, emailSubject, enableEmail });
        }

        if (cell?.type === "date") {
            const enableEmail = false;
            const message = `Date has changed from ${cell.value} to ${req.body.value} in ${dataCollection?.name} - ${workspace?.name}`
            const emailSubject = `Date change in ${workspace?.name} - ${dataCollection?.name}`;
            notifyUsers({ cell, workspace, dataCollection, recipients, req, res, message, emailSubject, enableEmail });
        }

        io.emit("update", { userId: initiator?._id })

        // Update the row values with the new cell value
        // Values are used to sort the rows more efficiently
        const cellResponse = await Cell.findByIdAndUpdate(req.params.id, req.body);
        const row: any = await Row.findOne({ _id: req.body.row });
        row.values[req.body.name] = req.body.value;

        let savedRow: any = await Row.findByIdAndUpdate(row._id, row, { new: true });


        res.send(cellResponse);
    } catch (error) {
        res.status(400).send({ success: false })
    }
}

type TNotifyUserProps = {
    cell: any;
    workspace: any;
    dataCollection: any;
    recipients: string[];
    req: Request;
    res: Response;
    message: string;
    emailSubject: string;
    enableEmail: boolean;
}

const notifyUsers = async ({ cell, workspace, dataCollection, recipients, req, res, message, emailSubject, enableEmail }: TNotifyUserProps) => {
    const row = await Row.findOne({ _id: cell?.row });
    const rowUser = await User.findOne({ _id: row?.assignedTo });

    io.emit(rowUser?._id || "", { message, priority: "Low", userId: rowUser?._id });

    const notification = new Notification({
        message,
        workspaceId: workspace?._id,
        assignedTo: rowUser?._id,
        priority: "Low",
    })

    notification.save();

    for (const member of workspace?.members || []) {
        const workspaceMember = await User.findOne({ email: member.email });

        if (workspaceMember?.email !== rowUser?.email) {
            io.emit(workspaceMember?._id || "", { message, priority: "Low" });

            let memberNotification = new Notification({
                message,
                workspaceId: workspace?._id,
                assignedTo: workspaceMember?._id,
                priority: "Low",
            })

            memberNotification.save();
        }
    }

    if (enableEmail) {
        sendEmail({
            email: recipients,
            subject: emailSubject,
            payload: {
                dataCollectionName: dataCollection?.name,
                message,
                link: `${process.env.CLIENT_URL || "http://localhost:5173"}/workspaces/${workspace?._id}/dataCollections/${dataCollection?._id}`
            },
            template: "./template/dataCollectionStatusChange.handlebars",
            res: res
        }, (res: Response) => {
        })
    }

}