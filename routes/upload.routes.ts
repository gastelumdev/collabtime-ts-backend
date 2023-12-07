import { Router } from "express";
import * as uploadController from "../controllers/upload.controller"
import verifyToken from "../middleware/authJWT";

const router = Router();

// router.post("/upload", verifyToken, uploadController.upload);
// router.post("/uploadDocs", verifyToken, uploadController.uploadDoc);

export default router;