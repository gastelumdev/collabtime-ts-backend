import { Router } from "express";
import * as messageController from "../controllers/message.controller";
import verifyToken from "../middleware/authJWT";

const router = Router();

router.get("/workspaces/:workspaceId/messages", verifyToken, messageController.getMessages);
router.post("/workspaces/:workspaceId/messages", verifyToken, messageController.createMessage);
router.post("/workspaces/:workspaceId/messages/typing", verifyToken, messageController.typingMessage);
router.get("/workspaces/:workspaceId/messages/unread", verifyToken, messageController.getUnreadMessages);
router.post("/workspaces/:workspaceId/messages/callUpdateMessages", verifyToken, messageController.callUpdateMessages);
router.post("/workspaces/:workspaceId/messages/markAsRead", verifyToken, messageController.markAsRead);

export default router;