import { Router } from "express";
import * as notificationController from "../controllers/notification.controller";
import verifyToken from "../middleware/authJWT";

const router = Router();

router.get("/notifications/:notificationsFilter", verifyToken, notificationController.getNotifications);
router.post("/notifications/callUpdate/:priority", verifyToken, notificationController.callUpdate);

export default router;