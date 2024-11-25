import { Request, Response } from "express";
import Notification from "../models/notification.model";
import User from "../models/auth.model";

export const getNotifications = async (req: Request, res: Response) => {
    const user = await User.findOne({ _id: (<any>req).user._id });
    const notificationsFilter = req.params.notificationsFilter;
    // const id = req.params.workspaceId;
    let notifications;

    const workspaceIds = user?.workspaces.map((item) => {
        return item.id;
    })

    try {
        if (notificationsFilter === "All") {
            notifications = await Notification.find({ workspaceId: { "$in": workspaceIds } }).sort({ createdAt: -1 });
        } else {
            notifications = await Notification.find({ workspaceId: { "$in": workspaceIds }, priority: notificationsFilter }).sort({ createdAt: -1 });
        }

        const filteredNotifications = notifications.filter((item) => {
            return item.assignedTo?.toString() == user?._id.toString() || item.assignedTo == null
        })

        res.send(filteredNotifications);
    } catch (error) {
        res.status(400).send(error);
    }
}

export const callUpdate = async (req: Request, res: Response) => {
    const notifications = await Notification.find({ workspaceId: req?.params.workspaceId, priority: req.params.priority })
    try {
        res.send(notifications);
    } catch (error) {
        res.status(400).send({ success: false })
    }

}