import { NextFunction, Request, Response } from 'express';
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt"
import crypto from "crypto"
import * as userServices from '../services/auth.service';
import verifyToken from '../middleware/authJWT';
import User from "../models/auth.model"
import Token from '../models/token.model';
import Notification from '../models/notification.model';
import sendEmail from '../utils/sendEmail';
import { io } from "../index";
import Workspace from '../models/workspace.model';
import { admin, viewOnly } from '../utils/defaultGroups';
import UserGroup from '../models/userGroup.model';

export const register = async (req: Request, res: Response) => {
    const user = await User.findOne({ email: req.body.email });

    try {
        if (user) {
            res.status(500).send({ successful: false, message: "User already exists." });
        } else {


            const hash = await bcrypt.hash(req.body.password, Number(10));
            const user = new User({
                firstname: req.body.firstname,
                lastname: req.body.lastname,
                email: req.body.email,
                role: req.body.role,
                password: hash,
                workspaces: [],
            });

            user.save();

            const workspace = new Workspace({
                name: "My Workspace",
                invitees: [],
                members: [{ email: req.body.email, permissions: 2 }],
                owner: user._id,
                tags: [],
                workspaceTags: []
            });

            workspace.save();

            await User.findByIdAndUpdate(user._id, { ...user.toObject(), defaultWorkspaceId: workspace._id.toString(), workspaces: [{ id: workspace.toObject()._id, permissions: 2 }] });

            const adminUserGroup = new UserGroup({
                name: "All Privileges",
                workspace: workspace._id,
                permissions: admin,
                users: [user._id]
            })

            const viewOnlyUserGroup = new UserGroup({
                name: "View Only",
                workspace: workspace._id,
                permissions: viewOnly,
                users: []
            })

            adminUserGroup.save()
            viewOnlyUserGroup.save()

            sendEmail({ email: req.body.email, subject: "Collabtime Beta Invitation.", payload: { name: user.firstname, email: user.email, password: req.body.password }, template: "./template/welcome.handlebars" }, (res: Response) => null);

            res.send({ successful: true, message: "Registered successfully." });
        }
    } catch (err) {
        res.send(err);
    }
}

export const login = async (req: Request, res: Response) => {
    const user = await User.findOne({
        email: req.body.email
    });

    try {
        if (!user) {
            res.status(404).send({ message: "Login failed. Try again." });
        } else {
            const passwordIsValid = bcrypt.compareSync(req.body.password, user.password);
            if (!passwordIsValid) {
                const notification = new Notification({
                    message: `${user.firstname} ${user.lastname} attempted to login.`,
                    dataSource: "Login",
                    priority: "Low",
                });
                notification.save();

                io.emit("update", {});
                res.status(401).send({ accesToken: null, message: "Login failed. Try again." });
            } else {
                const token = jwt.sign({ id: user.id }, process.env.API_SECRET || "myapisecret", { expiresIn: "365d" });

                try {
                    const notification = new Notification({
                        message: `${user.firstname} ${user.lastname} logged in.`, dataSource: "login", priority: "Low"
                    });
                    notification.save();
                    io.emit("update", {})
                    res.status(200).send({ user: user, message: "Login successful", accessToken: token });
                } catch (error) {
                    res.status(500).send({ message: error })
                }
            }
        }
    } catch (error) {
        res.status(500).send({ message: error });
    }
}

export const getUser = async (req: Request, res: Response) => {
    const user = await User.findOne({ _id: req.params.id });

    try {
        if (user) {
            res.send(user);
        } else {
            res.status(400).send({ success: false });
        }
    } catch (error) {
        res.status(400).send({ success: false });
    }
}

export const resetPasswordRequest = async (req: Request, res: Response, next: NextFunction) => {
    const user = await User.findOne({ email: req.body.email });

    if (!user) throw new Error("User does not exist.");
    let token = await Token.findOne({ userId: user._id });
    if (token) await token.deleteOne();
    let resetToken = crypto.randomBytes(32).toString("hex");
    const hash = await bcrypt.hash(resetToken, Number(10));

    await new Token({
        userId: user._id,
        token: hash,
        createdAt: Date.now(),
    }).save();

    const link = `${process.env.CLIENT_URL || "http://localhost:5173"}/passwordReset?token=${resetToken}&id=${user._id}`;
    sendEmail({ email: user.email, subject: "Password Reset Request", payload: { name: user.firstname, link: link }, template: "./template/requestResetPassword.handlebars", res }, (res: Response) => res.send({ success: true }));
}

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {

    let passwordResetToken = await Token.findOne({ userId: req.body.userId });
    if (!passwordResetToken) throw new Error("Invalid or expired password reset token.");

    const isValid = await bcrypt.compare(req.body.token, passwordResetToken.token);
    if (!isValid) throw new Error("Invalid or expired password reset token.");

    const hash = await bcrypt.hash(req.body.password, Number(10));

    await User.updateOne({ _id: req.body.userId }, { $set: { password: hash } }, { new: true });

    const user = await User.findById({ _id: req.body.userId });

    try {
        sendEmail({ email: user?.email || "", subject: "Password Reset Successfully", payload: { name: user?.firstname || "" }, template: "./template/resetPassword.handlebars", res }, (res: Response) => {
            io.emit("passwordReset", { userId: user?._id, message: "Password Reset Successfully" })
            res.send({ success: true });
        });
    } catch (error) {
        res.status(500).send({ success: false })
    }

    await passwordResetToken.deleteOne();
}

export const getAllUsers = async (req: Request, res: Response) => {
    const users = await User.find({});
    try {
        res.send(users)
    } catch (error) {
        res.status(400).send(error)
    }

}

export const getAllWorkspaceUsers = async (req: Request, res: Response) => {

    try {
        const workspace = await Workspace.findOne({ _id: req.params.workspaceId });
        const members: any = workspace?.members;
        let users = []

        for (const member of members) {
            const user = await User.findOne({ email: member.email });
            users.push(user);
        }

        res.send(users)
    } catch (error) {
        res.status(400).send(error)
    }

}


export const updateUser = async (req: Request, res: Response) => {
    const user = req.body;
    const newUser = { ...user }
    const updatedUser = await User.findByIdAndUpdate(req.params.id, newUser, { new: true });
    console.log(updatedUser)
    res.send(newUser);
}


