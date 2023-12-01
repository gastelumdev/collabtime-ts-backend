import { Request, Response } from "express";
import handleUpload from "../utils/handleUpload";

export const upload = async (req: Request, res: Response) => {
    console.log("UPLOAD", req.file);
    try {
        // res.send({filename: req.file?.filename})
        if (req.file) {
            const b64 = Buffer.from(req.file.buffer).toString("base64");
            let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
            
            const cldRes = await handleUpload(dataURI);
            console.log("CLOUD RES", cldRes)
            res.send(cldRes);
        }
        

    } catch (error) {
        console.log(error)
        res.status(400).send({success: false})
    }
}