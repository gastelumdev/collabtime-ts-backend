import jwt from "jsonwebtoken";
import User from "../models/auth.model";
import { NextFunction, Request, Response } from "express";

const verifyToken = (req: Request, res: Response, next: NextFunction) => {
    if (req.headers && req.headers.authorization && req.headers.authorization.split(" ")[0] === "JWT") {
        jwt.verify(req.headers.authorization.split(" ")[1], process.env.API_SECRET || "myapisecret", async function (err, decode) {
            console.log(err)
            if (err) (<any>req).user = undefined;
            console.log((<any>decode).id)
            try {

                const user = await User.findOne({
                    _id: (<any>decode).id
                });

                try {
                    (<any>req).user = user;
                    console.log("Request", (<any>req).user.id);
                    if ((<any>req).user) {
                        next();
                    } else {
                        res.status(401).send({success: false})
                    }
                    
                } catch (error) {
                    console.log(error);
                    res.status(500).send({message: error});
                }
            } catch(error) {
                console.log("Error is:", error);
                res.status(401).send({message: error})
            }
        });
    } else {
        // (<any>req).user = undefined;
        // next();

        res.status(401).send({success: false})
    }
}

export default verifyToken;