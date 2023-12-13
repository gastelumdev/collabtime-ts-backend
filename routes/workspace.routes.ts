import { Router } from "express";
import * as workspaceController from "../controllers/workspace.controller";
import verifyToken from "../middleware/authJWT";
import verifyWorkspace from "../middleware/workspaceAccess";

const router = Router()

router.get("/workspaces", verifyToken, workspaceController.getWorkspaces);
router.post("/workspaces", verifyToken, workspaceController.createWorkspace);
router.get("/workspaces/:id", verifyToken, verifyWorkspace, workspaceController.getOneWorkspace);
router.post("/workspaces/update/:id", verifyToken, workspaceController.updateWorkspace);
router.post("/workspaces/delete/:id", verifyToken, workspaceController.deleteWorkspace);
router.get("/workspaces/:id/users", verifyToken, workspaceController.getUsers);
router.post("/workspaces/:id/inviteTeamMembers", verifyToken, workspaceController.inviteTeamMembers);
router.post("/workspaces/:id/joinWorkspace", workspaceController.joinWorkspace);
router.post("/workspaces/:id/removeMember", verifyToken, workspaceController.removeMember);
router.post("/workspaces/:id/removeInvitee", verifyToken, workspaceController.removeInvitee);
router.post("/workspaces/callUpdate", verifyToken, workspaceController.callUpdate);
router.post("/workspaces/:workspaceId/tagExists", verifyToken, workspaceController.tagExists);

export default router;