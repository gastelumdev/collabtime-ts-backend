import {Schema, model} from "mongoose";
import { INotification, INotificationDocument, INotificationModel } from "../services/notifications.service";

const notificationSchema: Schema<INotificationDocument> = new Schema({
    message: {type: String, required: true},
    workspaceId: {type: Schema.Types.ObjectId},
    assignedTo: {type: Schema.Types.ObjectId, default: null},
    createdAt: {type: Date, default: Date.now},
    dataSource: {type: String},
    priority: {type: String},
    read: {type: Boolean, required: true, default: false}
}, {
    timestamps: true
});

notificationSchema.statics.buildNotification = (args: INotification) => {
    return new Notification(args);
};

const Notification = model<INotificationDocument, INotificationModel>("Notifications", notificationSchema);

export default Notification;