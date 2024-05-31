import { Request, Response } from "express";
import Message from "../models/message.model";
import User from "../models/auth.model";
import Workspace from "../models/workspace.model";
import { io } from "../index";

export const getMessages = async (req: Request, res: Response) => {
    try {
        const messages = await Message.find({ workspace: req.params.workspaceId });
        res.send(messages);
    } catch (error) {
        res.status(400).send({ success: false })
    }
}

export const createMessage = async (req: Request, res: Response) => {
    try {
        const user = await User.findOne({ _id: (<any>req).user._id });

        const workspace = await Workspace.findOne({ _id: req.params.workspaceId });
        const body = req.body;

        const workspaceMembers = []

        for (const member of workspace?.members || []) {
            console.log(member.email)
            const workspaceMember = await User.findOne({ email: member.email });
            if (workspaceMember?._id.toString() !== user?._id.toString()) workspaceMembers.push(workspaceMember);
        }

        const message = new Message({
            ...body,
            createdBy: user,
            workspace: workspace?._id,
            read: workspaceMembers,
        });

        message.save()

        io.emit("update-message", { message: message, workspace });

        res.send(message)
    } catch (error) {
        res.status(400).send({ success: false })
    }
}

export const typingMessage = async (req: Request, res: Response) => {
    try {
        const user = await User.findOne({ _id: (<any>req).user._id });

        io.emit("user-typing-message", { user });
        res.send({ success: true });
    } catch (error) {
        res.status(400).send({ success: false })
    }
}

export const getUnreadMessages = async (req: Request, res: Response) => {
    try {
        const user = await User.findOne({ _id: (<any>req).user._id });
        const messages = await Message.find({ workspace: req.params.workspaceId });

        const filteredMessages = messages.filter((item) => {
            return item.createdBy._id?.toString() !== user?._id.toString();
        });

        console.log("FILTEREDMESSAGES", filteredMessages)

        const finalMessages = [];

        for (const message of filteredMessages) {
            for (const teamMember of message.read) {
                console.log(teamMember)
                if (teamMember._id?.toString() === user?._id.toString()) {
                    finalMessages.push(message);
                }
            }
        }

        console.log("USERID", user?._id)
        console.log("FINALMESSAGES", finalMessages)

        res.send(finalMessages);
    } catch (error) {
        console.log(error)
        res.status(400).send({ success: false });
    }
}

export const markAsRead = async (req: Request, res: Response) => {
    try {
        const user = await User.findOne({ _id: (<any>req).user._id });
        const messages = await Message.find({ workspace: req.params.workspaceId });

        const newMessages = []

        for (const message of messages) {
            const filteredMembers = [];
            for (const member of message.read) {
                if (member.email !== user?.email) {
                    filteredMembers.push(member);
                }
            }
            newMessages.push({ ...message.toJSON(), read: filteredMembers });
        }

        for (const message of newMessages) {
            console.log("MESSAGE BEFORE", message);
            const newMessage = await Message.findByIdAndUpdate(message._id, message, { new: true });
            console.log("MESSAGE AFTER", newMessage)
        }

    } catch (error) {
        res.status(400).send({ success: false })
    }
}

export const callUpdateMessages = async (req: Request, res: Response) => {
    try {
        res.send({ success: true });
    } catch (error) {
        res.status(400).send({ success: false });
    }
}