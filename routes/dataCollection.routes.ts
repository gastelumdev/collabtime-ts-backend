import { Router } from "express";
import * as dataCollectionController from "../controllers/dataCollection.controller";
import verifyToken from "../middleware/authJWT";

const router = Router();

router.get("/workspaces/:workspaceId/dataCollections", verifyToken, dataCollectionController.getDataCollections);
router.post("/workspaces/:workspaceId/dataCollections", verifyToken, dataCollectionController.createDataCollection);
router.post("/workspaces/:workspaceId/updateDataCollections/:id", verifyToken, dataCollectionController.updateDataCollection);
router.post("/workspaces/:workspaceId/deleteDataCollections/:id", verifyToken, dataCollectionController.deleteDataCollection);
router.get("/workspaces/:workspaceId/dataCollections/:id", verifyToken, dataCollectionController.getDataCollection);

export default router;