import { Router } from "express";
import * as cellController from "../controllers/cell.controller";
import verifyToken from "../middleware/authJWT";

const router = Router()

router.post("/workspaces/:workspaceId/dataCollections/:dataCollectionId/cells/:id", verifyToken, cellController.updateCell);

export default router;