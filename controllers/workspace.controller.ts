import { Request, Response } from "express"
import Workspace from "../models/workspace.model"
import User from "../models/auth.model"
import nodemailer from "nodemailer";
import handlebars from "handlebars";
import fs from "fs";
import path from "path";
import { IUser } from "../services/auth.service"
import { TInvitee, TUser, TWorkspace } from "../types"
import { io } from "../index";

export const getWorkspaces = async (req: Request, res: Response) => {
    const user = await User.findOne({_id: (<any>req).user._id});
    const data = [];
    if (user) {
        try {
            for (const userWorkspace of user.workspaces) {
                const workspace = await Workspace.findOne({_id: userWorkspace.id});
                data.push(workspace);
            }
            res.status(200).send(data);
        } catch (err) {
            console.log(err)
            res.status(400).send({success: false});
        }
        
    } else {
        res.send({success: false});
    }
}

export const createWorkspace = async (req: Request, res: Response) => {
    const user = await User.findOne({_id: (<any>req).user._id});

    if ((<any>req).user) {
        const workspace = new Workspace({...(req.body), owner: (<any>req).user._id});

        if (workspace && user) {
            workspace.members.push({email: user.email, permissions: 2});

            try {
                await workspace.save();
                const userWorkspaces = user.workspaces;
                userWorkspaces.push({id: workspace._id, permissions: 2});
                
                await User.updateOne({_id: (<any>req).user._id}, {$set: {workspaces: userWorkspaces}});
                res.send(workspace);
                io.emit("update", {});
            
            } catch (error) {
                console.log("No user")
                res.status(400).send({success: false, error: error});
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
        const workspace = await Workspace.findByIdAndUpdate(req.params.id, req.body);
        res.send(workspace);
    } catch (error) {
        res.status(400).send(error);
    }
}

export const deleteWorkspace = async (req: Request, res: Response) => {
    try {
        const workspace = await Workspace.findOne({_id: req.params.id, owner: (<any>req).user._id});
        const user = await User.findOne({_id: (<any>req).user._id});
        const userWorkspaces = user?.workspaces.filter((item) => {
            return !workspace?._id.equals(item.id);
        });


        console.log(userWorkspaces);
        await User.updateOne({_id: user?._id}, {$set: {workspaces: userWorkspaces}});

        if (workspace) {
            for (const member of workspace?.members) {
                let currentMember: any = await User.findOne({email: member.email});
                console.log("CURRENT MEMBER", currentMember);
                let workspaceMembers = currentMember?.workspaces.filter((item: any) => {
                    console.log(workspace._id, item.id)
                    console.log(workspace._id.equals(item.id))
                    return !workspace._id.equals(item.id);
                });
                console.log("WORKSPACE MEMBERS", workspaceMembers)

                if (currentMember) {
                    currentMember.workspaces = workspaceMembers || user?.workspaces
                    let updatedMember = await User.updateOne({email: member.email}, currentMember);
                    
                    console.log("UPDATED MEMBER", updatedMember);
                }
            }
        }
        
        await Workspace.findByIdAndDelete({_id: req.params.id, owner: (<any>req).user._id});
        
        res.send(workspace);
    } catch (error) {
        res.status(400).send(error);
    }
}

export const getUsers = async (req: Request, res: Response) => {
    

    try {
        const workspace = await Workspace.findById(req.params.id);
        const membersAndInvitees = workspace?.members.concat(workspace?.invitees);
        
        const nonMemberEmails = membersAndInvitees?.map((item) => {
            return item.email;
        });

        const memberEmails = workspace?.members.map((item) => {
            return item.email;
        });

        const inviteeEmails = workspace?.invitees.map((item) => {
            return item.email;
        })
        
        const nonMembers = await User.find({email: {$nin: nonMemberEmails}});
        const members = await User.find({email: {$in: memberEmails}});
        const invitees = await User.find({email: {$in: inviteeEmails}});

        console.log("Non members", nonMembers);
        console.log("members", members);
        console.log("invitees", invitees)

        const reactSelectOptions = nonMembers.map((item: any) => {
            return {value: item.email, label: `${item.firstname} ${item.lastname}`};
        })
        res.send({members, invitees, nonMembers, reactSelectOptions});
    } catch (error) {
        res.status(400).send({success: false})
    }
}

export const inviteTeamMembers = async (req: Request, res: Response) => {
    const workspace = await Workspace.findByIdAndUpdate(req.params.id, req.body);
    try {
        
        if (workspace) {
            for (const invitee of req.body.invitees) {
                let user = await User.findOne({email: invitee.email});
                try {
                    const transporter = nodemailer.createTransport({
                        host: process.env.EMAIL_HOST,
                        port: 465,
                        auth: {
                          user: process.env.EMAIL_USER,
                          pass: process.env.EMAIL_PASS, // naturally, replace both with your real credentials or an application-specific password
                        },
                    });
                  
                    const source = fs.readFileSync(path.join(path.resolve() + "/utils", "./template/inviteTeamMember.handlebars"), "utf8");
                    const compiledTemplate = handlebars.compile(source);
                    const options ={
                        from: process.env.EMAIL_USER,
                        to: invitee.email,
                        subject: "You've been invited to join a Collabtime workspace.",
                        html: compiledTemplate({workspaceName: workspace.name, link: `${process.env.CLIENT_URL || "http://localhost:5173"}/joinWorkspace?workspaceId=${workspace._id}&id=${user?._id}`}),
                    };

                    transporter.sendMail(options, (error: any, info: any) => {
                        if (error) {
                            throw new Error(error);
                        } else {
                            res.status(200).json({
                                success: true,
                            });
                        }
                    });
                } catch (error) {
                    res.status(400).send({success: false})
                }
                
            }
        }
        
        res.send(workspace);
    } catch (error) {
        res.status(400).send(error);
    }
}

export const joinWorkspace = async (req: Request, res: Response) => {
    const user = await User.findOne({_id: req.body.userId});
    const workspace = await Workspace.findOne({_id: req.body.workspaceId});

    
    console.log("WORKSPACE", workspace)

    const invitees = workspace?.invitees.filter((item) => {
        return item.email !== user?.email;
    });

    const member = workspace?.invitees.filter((item) => {
        return item.email === user?.email;
    })[0] || [];



    if (workspace) {
        workspace.invitees = invitees || workspace.invitees;
        // workspace.members = members || workspace.members;
        workspace.members.push(member as TInvitee)
        workspace.save();
    }

    console.log("INVITEES",invitees);
    console.log("MEMBER",member);
    user?.workspaces.push({id: workspace?._id, permissions: (member as TInvitee).permissions});
    user?.save();


    res.send({success: true})
}

export const callUpdate = async (req: Request, res: Response) => {
    res.send({success: true});
}