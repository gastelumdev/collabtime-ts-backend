import { Router } from "express";
import * as documentController from "../controllers/document.controller";
import verifyToken from "../middleware/authJWT";

const router = Router();

router.get("/workspaces/:workspaceId/documents", verifyToken, documentController.getDocuments);
router.post("/workspaces/:workspaceId/documents", verifyToken, documentController.createDocument);
router.post("/workspaces/:workspaceId/documents/update", verifyToken, documentController.updateDocument);

export default router;