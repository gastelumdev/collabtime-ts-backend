import { Router } from "express";
import * as notificationController from "../controllers/notification.controller";
import verifyToken from "../middleware/authJWT";

const router = Router();

router.get("/workspaces/:workspaceId/notifications/:notificationsFilter", verifyToken, notificationController.getNotifications);
router.post("/workspaces/:workspaceId/callUpdate/:priority", verifyToken, notificationController.callUpdate);

export default router;