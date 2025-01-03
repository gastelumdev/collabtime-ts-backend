import { Router } from "express";
import * as eventController from "../controllers/event.controller"
import verifyToken from "../middleware/authJWT";

const router = Router();

router.get("/workspaces/:workspaceId/events", verifyToken, eventController.getEvents);

export default router;