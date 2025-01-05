import { Router } from "express";
import * as eventController from "../controllers/event.controller"
import verifyToken from "../middleware/authJWT";

const router = Router();

router.get("/workspaces/:workspaceId/events", verifyToken, eventController.getEvents);
router.get("/workspaces/:workspaceId/unreadEvents", verifyToken, eventController.getUnreadEvents);

export default router;