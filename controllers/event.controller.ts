import { Request, Response } from "express";
import Event from "../models/event.model";
import User from "../models/auth.model";
import Workspace from "../models/workspace.model";
import { io } from "../index";
import UserGroup from "../models/userGroup.model";
import { IEvent } from "../services/event.service";
import DataCollection from "../models/dataCollection.model";

export const getEvents = async (req: Request, res: Response) => {
    try {
        const workspaceId = req.params.workspaceId;
        const user = (<any>req).user;
        let isAdmin = false;
        let events = null;

        const userGroup = await UserGroup.findOne({ workspace: workspaceId, name: "All Privileges" });
        if (userGroup?.users.includes(user._id)) {
            isAdmin = true;
        }

        if (isAdmin) {
            events = await Event.find({ workspace: workspaceId, priority: { $gte: 100 } }).sort({ createdAt: -1 });
        } else {
            events = await Event.find({ workspace: workspaceId }).sort({ createdAt: -1 });
        }

        const result: any = []

        for (const event of events) {
            const workspace = await Workspace.findOne({ _id: event.workspace });
            let dataCollection = null;

            if (event.dataCollection !== null) {
                dataCollection = await DataCollection.findOne({ _id: event.dataCollection });
            }

            if (!event.read?.includes(user._id.toString())) {
                const read = [...event.read as [], user._id.toString()];
                result.push({ ...event.toObject(), workspace, dataCollection, read });

                await Event.findByIdAndUpdate(event._id, { read }, { new: true });
            } else {
                result.push({ ...event.toObject(), workspace, dataCollection });
            }

            io.emit('update notification marker', {})
        }

        res.send(result);
    } catch (error) {
        res.status(400).send({ success: false })
    }
}

export const getUnreadEvents = async (req: Request, res: Response) => {
    try {
        const workspaceId = req.params.workspaceId;
        const userId = (<any>req).user._id;
        const events = await Event.find({ workspace: workspaceId, priority: { $gte: 100 } }).sort({ createdAt: -1 });

        const result = [];

        for (const event of events) {
            if (!event.read?.includes(userId)) {

                result.push(event)
            }
        }

        res.send(result);
    } catch (error) {
        res.status(400).send({ success: false })
    }
}