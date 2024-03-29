import { Request, Response } from "express"
import Workspace from "../models/workspace.model"
import User from "../models/auth.model"
import Notification from "../models/notification.model";
import nodemailer from "nodemailer";
import handlebars from "handlebars";
import fs from "fs";
import path from "path";
import { IUser } from "../services/auth.service"
import { TInvitee, TUser, TWorkspace } from "../types"
import { io } from "../index";
import DataCollection from "../models/dataCollection.model";
import Cell from "../models/cell.models";
import Row from "../models/row.models";
import Column from "../models/column.model";
import sendEmail from "../utils/sendEmail";
import { IWorkspace } from "../services/workspace.service";

export const getWorkspaces = async (req: Request, res: Response) => {
    const user = await User.findOne({ _id: (<any>req).user._id });
    const data = [];

    io.emit("getWorkspaces-" + user?._id, { success: true })

    if (user) {
        try {
            for (const userWorkspace of user.workspaces) {
                const workspace = await Workspace.findOne({ _id: userWorkspace.id });
                data.push(workspace);
            }
            console.log(data)
            res.status(200).send(data);
        } catch (err) {
            console.log(err)
            res.status(400).send({ success: false });
        }

    } else {
        res.send({ success: false });
    }
}

export const createWorkspace = async (req: Request, res: Response) => {
    const user = await User.findOne({ _id: (<any>req).user._id });

    if ((<any>req).user) {
        const workspace = new Workspace({ ...(req.body), owner: (<any>req).user._id });

        if (workspace && user) {
            workspace.members.push({ email: user.email, permissions: 2 });

            try {
                await workspace.save();
                const userWorkspaces = user.workspaces;
                userWorkspaces.push({ id: workspace._id, permissions: 2 });

                await User.updateOne({ _id: (<any>req).user._id }, { $set: { workspaces: userWorkspaces } });
                res.send(workspace);
                io.emit("update", {});

            } catch (error) {
                res.status(400).send({ success: false, error: error });
            }
        }


    }

}

export const getOneWorkspace = async (req: Request, res: Response) => {
    const workspace = await Workspace.findById(req.params.id);

    try {
        res.send(workspace);
    } catch (error) {
        res.status(400).send(error);
    }

}

export const updateWorkspace = async (req: Request, res: Response) => {
    try {

        const newWorkspace: IWorkspace = req.body;
        const workspace = await Workspace.findByIdAndUpdate(req.params.id, newWorkspace, { new: true });
        res.send(workspace);
    } catch (error) {
        res.status(400).send(error);
    }
}

export const deleteWorkspace = async (req: Request, res: Response) => {
    try {
        const workspace = await Workspace.findOne({ _id: req.params.id, owner: (<any>req).user._id });
        const user = await User.findOne({ _id: (<any>req).user._id });
        const userWorkspaces = user?.workspaces.filter((item) => {
            return !workspace?._id.equals(item.id);
        });
        const dataCollections = await DataCollection.find({ workspace: workspace?._id });
        await User.updateOne({ _id: user?._id }, { $set: { workspaces: userWorkspaces } });

        if (workspace) {
            for (const member of workspace?.members) {
                let currentMember: any = await User.findOne({ email: member.email })
                let workspaceMembers = currentMember?.workspaces.filter((item: any) => {
                    return !workspace._id.equals(item.id);
                });

                if (currentMember) {
                    currentMember.workspaces = workspaceMembers || user?.workspaces
                    await User.updateOne({ email: member.email }, currentMember);
                }
            }

            // Delete any data collections associated to the workspace
            for (const dataCollection of dataCollections) {
                const dataCollectionId = dataCollection._id;
                await Cell.deleteMany({ dataCollection: dataCollectionId });
                await Row.deleteMany({ dataCollection: dataCollectionId });
                await Column.deleteMany({ dataCollection: dataCollectionId });
                await DataCollection.findByIdAndDelete({ _id: dataCollectionId });
            }
        }

        await Workspace.findByIdAndDelete({ _id: req.params.id, owner: (<any>req).user._id });

        res.send(workspace);
    } catch (error) {
        res.status(400).send(error);
    }
}

export const getUsers = async (req: Request, res: Response) => {


    try {
        const workspace = await Workspace.findById(req.params.id);
        const membersAndInvitees = workspace?.members.concat(workspace?.invitees);

        const nonMemberEmails = membersAndInvitees?.map(item => item.email);

        const memberEmails = workspace?.members.map(item => item.email);

        const inviteeEmails = workspace?.invitees.map(item => item.email)

        const nonMembers = await User.find({ email: { $nin: nonMemberEmails } });
        const members = await User.find({ email: { $in: memberEmails } });
        const invitees = await User.find({ email: { $in: inviteeEmails } });

        const reactSelectOptions = nonMembers.map((item: any) => {
            return { value: item.email, label: `${item.firstname} ${item.lastname}` };
        })
        res.send({ members, invitees, nonMembers, reactSelectOptions });
    } catch (error) {
        res.status(400).send({ success: false })
    }
}

export const inviteTeamMembers = async (req: Request, res: Response) => {
    const workspace = await Workspace.findByIdAndUpdate(req.params.id, req.body);
    console.log({ invitees: req.body.invitees })
    try {

        if (workspace) {
            for (const invitee of req.body.invitees) {
                let user = await User.findOne({ email: invitee.email });
                try {

                    sendEmail({
                        email: invitee.email,
                        subject: "You've been invited to join a Collabtime workspace.",
                        payload: { name: workspace.name, link: `${process.env.CLIENT_URL || "http://localhost:5173"}/joinWorkspace?workspaceId=${workspace._id}&id=${user?._id}` },
                        template: "./template/inviteTeamMember.handlebars",
                        res: res
                    }, (res: Response) => {
                        res.send({ success: true })
                    })
                } catch (error) {
                    res.status(400).send({ success: false })
                }

            }
        }

        res.send(workspace);
    } catch (error) {
        res.status(400).send(error)
    }
}

export const joinWorkspace = async (req: Request, res: Response) => {
    const user = await User.findOne({ _id: req.body.userId });
    const workspace = await Workspace.findOne({ _id: req.body.workspaceId });

    const invitees = workspace?.invitees.filter(item => item.email !== user?.email);
    const member = workspace?.invitees.filter(item => item.email === user?.email)[0];

    const numberOfFilteredInvitees = invitees?.length || 0;
    const numberOfInvitees = workspace?.invitees.length || 0;

    if (numberOfFilteredInvitees < numberOfInvitees) {
        if (workspace) {
            workspace.invitees = invitees || workspace.invitees;
            if (member) {
                workspace.members.push(member as TInvitee);
                user?.workspaces.push({ id: workspace?._id, permissions: (member as TInvitee).permissions });

                const dataCollections = await DataCollection.find({ workspace: workspace._id });

                for (const dataCollection of dataCollections) {
                    const columns = await Column.find({ dataCollection: dataCollection._id, type: "people" });
                    const cells = await Cell.find({ dataCollection: dataCollection._id, type: "people" });

                    for (const column of columns) {
                        const people: any = column.people;
                        people?.push(user);
                        const newColumn = { ...column, people: people }

                        await Column.findByIdAndUpdate(column._id, newColumn)
                    }

                    for (const cell of cells) {
                        const people: any = cell.people;
                        people?.push(user);
                        const newCell = { ...cell, people: people };

                        await Cell.findByIdAndUpdate(cell._id, newCell);
                    }
                }
            }
        }

        try {
            const notification = new Notification({
                message: `${user?.firstname} ${user?.lastname} has joined ${workspace?.name}`,
                workspaceId: workspace?._id,
                dataSource: "",
                priority: "Low",
            });
            notification.save();
            workspace?.save();
            user?.save();
            io.emit("update", `${user?.firstname} ${user?.lastname} has joined ${workspace?.name}`);
            res.send({ success: true });
        } catch (error) {
            res.send({ success: true });
        }
    } else {
        res.status(400).send({ success: false });
    }


}

export const removeMember = async (req: Request, res: Response) => {
    try {
        const user = await User.findOne({ _id: req.body.userId });
        const workspace = await Workspace.findOne({ _id: req.params.id });

        const filteredMembers = workspace?.members.filter(item => item.email !== user?.email);
        const filteredWorkspaces = user?.workspaces.filter(item => !workspace?._id.equals(item.id));

        if (workspace) {
            workspace.members = filteredMembers || workspace?.members;

            const dataCollections = await DataCollection.find({ workspace: workspace._id });

            for (const dataCollection of dataCollections) {
                const columns = await Column.find({ dataCollection: dataCollection._id, type: "people" });
                const cells = await Cell.find({ dataCollection: dataCollection._id, type: "people" });

                for (const column of columns) {
                    const filteredPeople = column.people?.filter((item: any) => {
                        return item.email !== user?.email;
                    });
                    const newColumn = { ...column.toJSON(), people: filteredPeople };
                    console.log("NEW COLUMN *****************************", newColumn);

                    await Column.findByIdAndUpdate(column._id, newColumn);
                }

                for (const cell of cells) {
                    const filteredPeople = cell.people?.filter((item) => {
                        return item.email !== user?.email;
                    });
                    const newCell = { ...cell.toJSON(), people: filteredPeople };

                    await Cell.findByIdAndUpdate(cell._id, newCell);
                }
            }
        }
        if (user) user.workspaces = filteredWorkspaces || user.workspaces;



        workspace?.save();
        user?.save();
        res.send({ success: true })
    } catch (error) {
        res.status(400).send({ success: false })
    }
}

export const removeInvitee = async (req: Request, res: Response) => {
    try {
        const user = await User.findOne({ _id: req.body.userId });
        const workspace = await Workspace.findOne({ _id: req.params.id });

        const filteredInvitees = workspace?.invitees.filter(item => item.email !== user?.email);

        if (workspace) workspace.invitees = filteredInvitees || workspace?.invitees;

        workspace?.save();
        res.send({ success: true });
    } catch (error) {
        res.status(400).send({ success: false });
    }
}

export const callUpdate = async (req: Request, res: Response) => {
    res.send({ success: true });
}

export const tagExists = async (req: Request, res: Response) => {
    try {
        const tag = req.body;

        console.log(tag)

        const workspaces = await Workspace.find({ _id: req.params.workspaceId });
        const dataCollections = await DataCollection.find({ workspace: req.params.workspaceId });

        let tagExists = false;

        for (const workspace of workspaces) {
            for (const workspaceTag of workspace.tags) {
                if (tag.name === workspaceTag.name) {
                    tagExists = true;
                }
            }
        }

        for (const dataCollection of dataCollections) {
            for (const dataCollectionTag of dataCollection.tags) {
                if (tag.name === dataCollectionTag.name) {
                    tagExists = true;
                }
            }
        }

        console.log("TAGEXISTS", tagExists)
        res.send({ tagExists: tagExists });
    } catch (error) {
        res.status(400).send({ success: false })
    }


}