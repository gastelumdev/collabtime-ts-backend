import { Request, Response } from "express";
import handleUpload from "../utils/handleUpload";

export const upload = async (req: Request, res: Response) => {
    console.log("UPLOAD", req.file);
    try {
        // res.send({filename: req.file?.filename})
        if (req.file) {
            if (req.file.mimetype === "image/jpeg" || req.file.mimetype === "image/jpg" || req.file.mimetype === "image/png") {
                const b64 = Buffer.from(req.file.buffer).toString("base64");
                let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
                
                const cldRes = await handleUpload(dataURI);
                console.log("CLOUD RES", cldRes)
                res.send(cldRes);
            } else {
                res.send({url: false})
            }
            
        } else {
            res.send({url: undefined})
        }
        

    } catch (error) {
        console.log(error)
        res.status(400).send({success: false})
    }
}

export const uploadDoc = async (req: Request, res: Response) => {
    console.log("UPLOAD", req.file);
    try {
        if (req.file) {
            
            res.send({url: `${process.env.APP_URL}/docs/${req.file.filename}`, originalname: req.file.originalname, file: req.file});
        } else {
            res.send({url: undefined})
        }
    } catch (error) {
        console.log(error)
        res.status(400).send({success: false})
    }
  }
  
  export const uploadPersistedDoc = async (req: Request, res: Response) => {
    console.log("UPLOAD", req.file);
    try {
        if (req.file) {
            
            res.send({url: `${process.env.APP_URL}/docs/${req.file.filename}`});
        } else {
            res.send({url: undefined})
        }
    } catch (error) {
        console.log(error)
        res.status(400).send({success: false})
    }
  }