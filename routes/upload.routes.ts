import { Router } from "express";
import * as uploadController from "../controllers/upload.controller"
import verifyToken from "../middleware/authJWT";
import { notesUpload } from "..";

const router = Router();

router.post("/upload", verifyToken, uploadController.upload)

export default router;