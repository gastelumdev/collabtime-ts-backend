import { Router } from "express";
import * as plannerController from "../../controllers/apps/planner.controller"
import verifyToken from "../../middleware/authJWT";
const router = Router();

router.get("/workspaces/:workspaceId/dataCollection/:dataCollectionId/row/:rowId", plannerController.getPlannerTasks);
router.get("/workspaces/:workspaceId/dataCollection/:dataCollectionId/bucketColumn", plannerController.getPlannerBucketColumn);

export default router;