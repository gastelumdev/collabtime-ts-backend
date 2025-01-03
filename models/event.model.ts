import { Schema, model } from "mongoose";
import { IEvent, IEventDocument, IEventModel } from "../services/event.service";

const eventSchema: Schema<IEventDocument> = new Schema({
    actionBy: { type: {}, required: true },
    assignee: { type: {}, default: null },
    workspace: { type: Schema.Types.ObjectId, required: true },
    dataCollection: { type: Schema.Types.ObjectId, default: null },
    type: { type: String, default: 'info' },
    priority: { type: Number, min: 0, max: 255, default: 50 },
    acknowledged: { type: Boolean, default: false },
    requiresAcknowledgement: { type: Boolean, default: false },
    message: { type: String, required: true },
    read: { type: [], default: [] },
    associatedUserIds: { type: [], required: true }
}, {
    timestamps: true
});

eventSchema.statics.buildMessage = (args: IEvent) => {
    return new Event(args);
}

const Event = model<IEventDocument, IEventModel>("Events", eventSchema);

export default Event;