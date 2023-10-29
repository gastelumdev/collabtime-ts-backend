import { NextFunction, Request, Response } from 'express';
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt"
import crypto from "crypto"
import * as userServices from '../services/auth.service';
import verifyToken from '../middleware/authJWT';
import User from "../models/auth.model"
import Token from '../models/token.model';
import setSendEmail from '../utils/sendEmail';
import { io } from "../index";

export const register = async (req: Request, res: Response) => {
    const user = await User.findOne({ email: req.body.email});

    try {
        if (user) {
            console.log(user);
            res.status(500).send({successful: false, message: "User already exists."});
        } else {
            const hash = await bcrypt.hash(req.body.password, Number(10));
            console.log(hash);
            const user = new User({
                firstname: req.body.firstname,
                lastname: req.body.lastname,
                email: req.body.email,
                role: req.body.role,
                password: hash,
                workspaces: []
            });

            user.save();

            res.send({successful: true, message: "Registered successfully."});
        }
    } catch (err) {
        res.send(err);
    }
}

export const login = async (req: Request, res: Response) => {
    const user = await User.findOne({
        email: req.body.email
    });

    console.log(user)

    try {
        if (!user) {
            res.status(404).send({message: "Login failed. Try again."});
        } else {
            console.log(user.password)
            const passwordIsValid = bcrypt.compareSync(req.body.password, user.password);
            if (!passwordIsValid) {
                console.log(passwordIsValid)
                io.emit("login", {success: false})
                res.status(401).send({accesToken: null, message: "Login failed. Try again."});
            } else {
                const token = jwt.sign({id: user.id}, process.env.API_SECRET || "myapisecret", {expiresIn: 2592000});
                
                try {
                    
                    res.status(200).send({user: user, message: "Login successful", accessToken: token});
                } catch (error) {
                    res.status(500).send({message: error})
                }
            }
        }
    } catch (error) {
        res.status(500).send({message: error});
    }
}

export const resetPasswordRequest = async (req: Request, res: Response, next: NextFunction) => {
    console.log(req.body.email)
    const user = await User.findOne({email: req.body.email});
    console.log(user)
    if (!user) throw new Error("User does not exist.");
    let token = await Token.findOne({userId: user._id});
    if (token) await token.deleteOne();
    let resetToken = crypto.randomBytes(32).toString("hex");
    const hash = await bcrypt.hash(resetToken, Number(10));

    await new Token({
        userId: user._id,
        token: hash,
        createdAt: Date.now(),
    }).save();

    console.log(resetToken)

    const link = `${process.env.CLIENT_URL || "http://localhost:5173"}/passwordReset?token=${resetToken}&id=${user._id}`;
    let sendEmail: any = await setSendEmail({email: user.email, subject: "Password Reset Request", payload: {name: user.firstname, link: link}, template: "./template/requestResetPassword.handlebars", res});
    
    sendEmail.transporter.sendMail(sendEmail.options, (error: any, info: any) => {
        if (error) {
            console.log(error)
          throw new Error(error);
        } else {
            console.log(info)
          res.status(200).json({
            success: true,
          });
        }
      });
}

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    console.log(req)
    let passwordResetToken = await Token.findOne({userId: req.body.userId});
    if (!passwordResetToken) throw new Error("Invalid or expired password reset token.");

    const isValid = await bcrypt.compare(req.body.token, passwordResetToken.token);
    if (!isValid) throw new Error("Invalid or expired password reset token.");
    
    const hash = await bcrypt.hash(req.body.password, Number(10));

    await User.updateOne({_id: req.body.userId}, {$set: {password: hash}}, {new: true});

    const user = await User.findById({_id: req.body.userId});

    try {
        let sendEmail: any = await setSendEmail({email: user?.email || "", subject: "Password Reset Successfully", payload: {name: user?.firstname || "" }, template: "./template/resetPassword.handlebars", res });
        sendEmail.transporter.sendMail(sendEmail.options, (error: any, info: any) => {
            if (error) {
              return error;
            } else {
              return res.status(200).json({
                success: true,
              });
            }
        });
    } catch (error) {
        console.log(error)
        res.status(500).send({success: false})
    }
    
    
    
    

    await passwordResetToken.deleteOne();
}



