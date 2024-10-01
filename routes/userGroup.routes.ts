import { Router } from "express";
import * as userGroupController from "../controllers/userGroup.controller";
import verifyToken from "../middleware/authJWT";

const router = Router();

router.get("/workspaces/:workspaceId/userGroups", verifyToken, userGroupController.getUserGroups)
router.post("/workspaces/:workspaceId/userGroups", verifyToken, userGroupController.createUserGroups)
router.put("/workspaces/:workspaceId/userGroups/:userGroupId", verifyToken, userGroupController.updateUserGroup)
router.delete("/workspaces/:workspaceId/userGroups/:userGroupId", verifyToken, userGroupController.deleteUserGroup)

export default router;