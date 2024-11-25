import { Request, Response } from "express";
import handleUpload from "../utils/handleUpload";

export const upload = async (req: Request, res: Response) => {
    try {
        // res.send({filename: req.file?.filename})
        if (req.file) {
            if (req.file.mimetype === "image/jpeg" || req.file.mimetype === "image/jpg" || req.file.mimetype === "image/png") {
                const b64 = Buffer.from(req.file.buffer).toString("base64");
                let dataURI = "data:" + req.file.mimetype + ";base64," + b64;

                const cldRes = await handleUpload(dataURI);
                res.send(cldRes);
            } else {
                res.send({ url: false })
            }

        } else {
            res.send({ url: undefined })
        }


    } catch (error) {
        res.status(400).send({ success: false })
    }
}

export const uploadDoc = async (req: Request, res: Response) => {
    try {
        if (req.files) {
            let filesRes = []
            for (const file of (<any>req).files) {
                filesRes.push({ url: `${process.env.APP_URL}/docs/${file.filename}`, originalname: file.originalname, file: file })
            }
            res.send({ files: filesRes });
        } else {
            res.send({ url: undefined })
        }
    } catch (error) {
        res.status(400).send({ success: false })
    }
}

export const uploadPersistedDoc = async (req: Request, res: Response) => {
    try {
        if (req.files) {
            let filesRes = []
            for (const file of (<any>req).files) {
                filesRes.push({ url: `${process.env.APP_URL}/docs/${file.filename}`, originalname: file.originalname, file: file })
            }
            res.send({ files: filesRes });
        } else {
            res.send({ url: undefined })
        }
    } catch (error) {
        res.status(400).send({ success: false })
    }
}