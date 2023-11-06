import { Request, Response } from "express";
import Notification from "../models/notification.model";

export const getNotifications = async (req: Request, res: Response) => {
    const notificationsFilter = req.params.notificationsFilter;
    console.log(notificationsFilter);
    let notifications;
    if (notificationsFilter === "All") {
        notifications = await Notification.find({}).sort({createdAt: -1});
    } else {
        notifications = await Notification.find({priority: notificationsFilter}).sort({createdAt: -1});
    }
    
    console.log(notifications)

    try {
        res.send(notifications);
    } catch (error) {
        console.log(error)
        res.status(400).send(error);
    }
}

export const callUpdate = async (req: Request, res: Response) => {
    const notifications = await Notification.find({priority: req.params.priority})
    try{
        res.send(notifications);
    } catch (error) {
        console.log(error);
        res.status(400).send({success: false})
    }
    
}