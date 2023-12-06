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
        const cell = await Cell.findOne({_id: req.params.id});
        const workspace = await Workspace.findOne({_id: req.params.workspaceId});
        const dataCollection = await DataCollection.findOne({_id: req.params.dataCollectionId});
        
        let recipients = [];
        for (const member of workspace?.members || []) {
            recipients.push(member.email);
        }


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

            sendEmail({
                email: user?.email || "", 
                subject: `New Assignment in ${workspace?.name} - ${dataCollection?.name}`, 
                payload: {
                    dataCollectionName: dataCollection?.name,
                    message: `You have been assigned an item in ${workspace?.name} - ${dataCollection?.name}`,
                    link: `${process.env.CLIENT_URL || "http://localhost:5173"}/workspaces/${workspace?._id}/dataCollections/${dataCollection?._id}`},
                template: "./template/dataCollectionStatusChange.handlebars",
                res: res
            }, (res: Response) => {
                console.log("SUCCESSFUL EMAIL");
                // res.send({success: true})
            })
        }

        if (cell?.type === "priority") {
            const enableEmail = false;
            const message = `Priority has changed from ${cell.value} to ${req.body.value} in ${dataCollection?.name}- ${workspace?.name}`
            const emailSubject = `Priority change in ${workspace?.name} - ${dataCollection?.name}`
            notifyUsers({cell, workspace, dataCollection, recipients, req, res, message, emailSubject, enableEmail});
        }

        if (cell?.type === "status") {
            const enableEmail = false;
            const message = `Status has changed from ${cell.value} to ${req.body.value} in ${dataCollection?.name} - ${workspace?.name}`
            const emailSubject = `Status change in ${workspace?.name} - ${dataCollection?.name}`;
            notifyUsers({cell, workspace, dataCollection, recipients, req, res, message, emailSubject, enableEmail});
        }

        if (cell?.type === "label") {
            const enableEmail = false;
            const message = `Label has changed from ${cell.value} to ${req.body.value} in ${dataCollection?.name} - ${workspace?.name}`
            const emailSubject = `Label change in ${workspace?.name} - ${dataCollection?.name}`;
            notifyUsers({cell, workspace, dataCollection, recipients, req, res, message, emailSubject, enableEmail});
        }

        if (cell?.type === "date") {
            const enableEmail = false;
            const message = `Date has changed from ${cell.value} to ${req.body.value} in ${dataCollection?.name} - ${workspace?.name}`
            const emailSubject = `Date change in ${workspace?.name} - ${dataCollection?.name}`;
            notifyUsers({cell, workspace, dataCollection, recipients, req, res, message, emailSubject, enableEmail});
        }

        io.emit("update")

        const cellResponse = await Cell.findByIdAndUpdate(req.params.id, req.body);
        res.send(cellResponse);
    } catch (error) {
        res.status(400).send({success: false})
    }
}

type TNotifyUserProps = {
    cell: any;
    workspace: any;
    dataCollection:any;
    recipients: string[];
    req: Request;
    res: Response;
    message: string;
    emailSubject: string;
    enableEmail: boolean;
}

const notifyUsers = async ({cell, workspace, dataCollection, recipients, req, res, message, emailSubject, enableEmail}: TNotifyUserProps) => {
    const row = await Row.findOne({_id: cell?.row});
    const rowUser = await User.findOne({_id: row?.assignedTo});

    io.emit(rowUser?._id || "", {message, priority: "Low"});

    const notification = new Notification({
        message,
        workspaceId: workspace?._id,
        assignedTo: rowUser?._id,
        priority: "Low",
    })

    notification.save();

    for (const member of workspace?.members || []) {
        const workspaceMember = await User.findOne({email: member.email});

        io.emit(workspaceMember?._id || "", {message, priority: "Low"});

        let memberNotification = new Notification({
            message,
            workspaceId: workspace?._id,
            assignedTo: workspaceMember?._id,
            priority: "Low",
        })

        memberNotification.save();
    }

    if (enableEmail) {
        sendEmail({
            email: recipients, 
            subject: emailSubject,
            payload: {
                dataCollectionName: dataCollection?.name,
                message,
                link: `${process.env.CLIENT_URL || "http://localhost:5173"}/workspaces/${workspace?._id}/dataCollections/${dataCollection?._id}`},
            template: "./template/dataCollectionStatusChange.handlebars",
            res: res
        }, (res: Response) => {
            console.log("SUCCESSFUL EMAIL");
            // res.send({success: true})
        })
    }
    
}