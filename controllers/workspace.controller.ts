import { Request, Response } from "express";
// Model Imports
import Workspace from "../models/workspace.model";
import * as workspaceModel from "../models/workspace.model";
import User from "../models/auth.model";
import * as authModel from "../models/auth.model";
import Notification from "../models/notification.model";
import DataCollection from "../models/dataCollection.model";
import * as dataCollectionModel from "../models/dataCollection.model";
import Cell from "../models/cell.models";
import Row from "../models/row.models";
import Column from "../models/column.model";
// Service Imports
import { IUser, IUserWorkspace } from "../services/auth.service"
import { IWorkspace } from "../services/workspace.service";
import * as workspaceService from "../services/workspace.service";
import * as dataCollectionService from "../services/dataCollection.service";
import * as userGroupService from "../services/userGroup.service";

import { TInvitee } from "../types";

import { io } from "../index";
import sendEmail from "../utils/sendEmail";
import UserGroup from "../models/userGroup.model";
import UserWorkspace from "../models/userWorkspace.model";


/**
 * Retrieves and sends the workspaces associated with the authenticated user.
 *
 * This asynchronous function gets the authenticated user by their ID from the request object,
 * then retrieves the workspaces associated with that user. If successful, it sends the workspaces
 * data in the response with a status code of 200. If there is an error, it sends a response with a
 * status code of 400 and a success flag set to false.
 *
 * @param {Request} req - The request object, expected to contain the authenticated user's ID.
 * @param {Response} res - The response object used to send back the desired HTTP response.
 * @returns {Promise<void>} - A promise that resolves when the response is sent.
 * 
 * @throws {Error} - If there is an error during the retrieval of user or workspaces.
 *
 * @example
 * app.get('/workspaces', getWorkspaces);
 */
export const getWorkspaces = async (req: Request, res: Response) => {
    const user = await authModel.getUserById((<any>req).user._id as string);
    const userWorkspaces = await UserWorkspace.find({ userId: user?._id });
    try {
        const data = await workspaceService.getUserWorkspaces(userWorkspaces as any);

        res.status(200).send(data);
    } catch (err) {
        res.status(400).send({ success: false })
    }
}

/**
 * Creates a new workspace and associates it with the authenticated user.
 *
 * This asynchronous function creates a new workspace using the data provided in the request body
 * and the authenticated user. It then associates the newly created workspace with the user and emits
 * an update event via a socket. If the workspace is successfully created, it sends the workspace data
 * in the response. If there is an error during the process, it sends a response with a status code of
 * 400 and an error message.
 *
 * @param {Request} req - The request object, expected to contain the workspace data in the body and the authenticated user.
 * @param {Response} res - The response object used to send back the desired HTTP response.
 * @returns {Promise<void>} - A promise that resolves when the response is sent.
 * 
 * @throws {Error} - If there is an error during the creation of the workspace or associating it with the user.
 *
 * @example
 * app.post('/workspaces', createWorkspace);
 */
export const createWorkspace = async (req: Request, res: Response) => {
    try {
        const user = (<any>req).user;
        const workspace: any = await workspaceService.createNewWorkspace(req.body, user);
        await workspaceService.addWorkspaceToUser(workspace, user);
        await userGroupService.createInitialSetup(workspace);

        io.emit("update", {});
        res.send(workspace);
    } catch (error) {
        res.status(400).send({ success: false, error: error });
    }
}

/**
 * Retrieves a single workspace by its ID and sends it in the response.
 *
 * This asynchronous function fetches a workspace document from the database using the ID
 * provided in the request parameters. If the workspace is successfully retrieved, it sends
 * the workspace data in the response. If there is an error during the process, it sends a response
 * with a status code of 400 and the error message.
 *
 * @param {Request} req - The request object, expected to contain the workspace ID in the request parameters.
 * @param {Response} res - The response object used to send back the desired HTTP response.
 * @returns {Promise<void>} - A promise that resolves when the response is sent.
 * 
 * @throws {Error} - If there is an error during the retrieval of the workspace.
 *
 * @example
 * app.get('/workspaces/:id', getOneWorkspace);
 */
export const getOneWorkspace = async (req: Request, res: Response) => {
    try {
        const workspace = await workspaceModel.getWorkspaceById(req.params.id);
        res.send(workspace);
    } catch (error) {
        res.status(400).send(error);
    }

}

/**
 * Updates an existing workspace with new data and sends the updated workspace in the response.
 *
 * This asynchronous function updates a workspace document in the database using the ID provided in the request parameters
 * and the new workspace data provided in the request body. If the update is successful, it sends the updated workspace
 * data in the response. If there is an error during the process, it sends a response with a status code of 400 and the error message.
 *
 * @param {Request} req - The request object, expected to contain the workspace ID in the request parameters and the new workspace data in the body.
 * @param {Response} res - The response object used to send back the desired HTTP response.
 * @returns {Promise<void>} - A promise that resolves when the response is sent.
 * 
 * @throws {Error} - If there is an error during the update of the workspace.
 *
 * @example
 * app.put('/workspaces/:id', updateWorkspace);
 */
export const updateWorkspace = async (req: Request, res: Response) => {
    try {
        const newWorkspace: IWorkspace = req.body;
        const workspace = workspaceModel.getWorkspaceByIdAndUpdate(req.params.id, newWorkspace);
        res.send(workspace);
    } catch (error) {
        res.status(400).send(error);
    }
}

/**
 * Deletes a workspace and associated data based on the request parameters.
 *
 * This function handles the deletion of a workspace and all associated data:
 * 1. Verifies if the requester (user) is the owner of the workspace.
 * 2. Removes the workspace from the user's list of workspaces.
 * 3. Removes the workspace from all the member's list of workspaces.
 * 4. Deletes all data collections associated with the workspace.
 * 5. Finally, deletes the workspace itself from the database.
 *
 * @param {Request} req - The HTTP request object containing parameters and user information.
 * @param {Response} res - The HTTP response object used to send a response back to the client.
 * @returns {Promise<void>} - A promise that resolves once the workspace and associated data are successfully deleted.
 *
 * @note This function is not part of automated testing and needs to have automated tests implemented.
 */
export const deleteWorkspace = async (req: Request, res: Response) => {
    console.log("Removing workspace from user")
    try {
        const user = (<any>req).user;
        // Get workspace by the id provided in the request and make sure that the owner matches
        const workspace = await workspaceModel.getOneByIdBasedOnOwner(req.params.id, user._id);

        if (workspace) {
            // Remove the workspace from the user's workspaces
            // await authModel.removeWorkspaceFromUser(workspace?._id, user);
            const userWorkspace = await UserWorkspace.findOne({ userId: user._id, workspaceId: workspace._id });
            await UserWorkspace.findOneAndDelete(userWorkspace?._id);
            // Go through each member associated to the workspace and remove the association
            await workspaceService.removeWorkspaceFromMembers(workspace);
            // Get all the data collections in the workspace
            await dataCollectionService.removeWorkspaceDataCollections(workspace);

            // Remove all data collections associated with a workspace
            await workspaceModel.getWorkspaceByIdAndDelete(workspace?._id, user._id);

            // Delete user groups
            await UserGroup.deleteMany({ workspace: workspace._id })

            res.send(workspace);
        } else {
            res.status(401).send({ message: "You are not authorized." });
        }
    } catch (error) {
        res.status(400).send({ message: "Something went wrong. Try again." });
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
            console.log({ invitees, member, numberOfFilteredInvitees, numberOfInvitees, workspace })
            const userGroup: any = await UserGroup.findOne({ workspace: workspace?._id, name: "View Only" });
            // const newUserGroup = { ...userGroup, users: [...userGroup.users, user?._id] };

            const updatedUserGroup = await UserGroup.findByIdAndUpdate(userGroup._id, { users: [...userGroup.users, user?._id] }, { new: true });
            console.log({ updatedUserGroup })

            const newUserWorkspace = new UserWorkspace({
                userId: user?._id,
                workspaceId: workspace?._id,
            });

            newUserWorkspace.save()

            const notification = new Notification({
                message: `${user?.firstname} ${user?.lastname} has joined ${workspace?.name}`,
                workspaceId: workspace?._id,
                dataSource: "",
                priority: "Low",
            });
            notification.save()
            workspace?.save();
            user?.save();
            io.emit("update", `${user?.firstname} ${user?.lastname} has joined ${workspace?.name}`)
            res.send({ success: true });
        } catch (error) {
            res.send({ success: true })
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

            const userGroups = await UserGroup.find({ workspace: workspace._id });

            for (const userGroup of userGroups) {
                if (userGroup.users.includes(user?._id)) {
                    const newUsers = userGroup.users.filter((item) => {
                        return item !== user?._id;
                    })

                    const updatedUserGroup = await UserGroup.findByIdAndUpdate(userGroup._id, { ...userGroup.toObject(), users: [...newUsers] });
                    console.log({ updatedUserGroup })
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