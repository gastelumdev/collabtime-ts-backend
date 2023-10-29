import { Router } from "express";
import * as workspaceController from "../controllers/workspace.controller";
import verifyToken from "../middleware/authJWT";

const router = Router()

router.get("/workspaces", verifyToken, workspaceController.getWorkspaces);
router.post("/workspaces", verifyToken, workspaceController.createWorkspace);
router.get("/workspaces/:id", verifyToken, workspaceController.getOneWorkspace);
router.post("/workspaces/update/:id", verifyToken, workspaceController.updateWorkspace);
router.post("/workspaces/delete/:id", verifyToken, workspaceController.deleteWorkspace);

export default router;