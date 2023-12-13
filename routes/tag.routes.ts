import { Router } from "express";
import * as tagController from "../controllers/tag.controller";
import verifyToken from "../middleware/authJWT";

const router = Router();

router.get("/workspaces/:workspaceId/tags", verifyToken, tagController.getTags);
router.post("/workspaces/:workspaceId/tags", verifyToken, tagController.createTag);
router.post("/workspaces/:workspaceId/tags/delete/:id", verifyToken, tagController.deleteTag);

export default router;