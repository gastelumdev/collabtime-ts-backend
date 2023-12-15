import {Schema, model} from "mongoose";
import { IMessage, IMessageDocument, IMessageModel } from "../services/message.service";

const messageSchema: Schema<IMessageDocument> = new Schema({
    content: {type: String, required: true},
    workspace: {type: Schema.Types.ObjectId},
    createdAt: {type: Date, default: Date.now},
    createdBy: {type: {}},
    read: {type: []},
}, {
    timestamps: true
});

messageSchema.statics.buildMessage = (args: IMessage) => {
    return new Message(args);
}

const Message = model<IMessageDocument, IMessageModel>("Messages", messageSchema);

export default Message;