import { Router } from "express";
import * as dataCollectionViewController from "../controllers/dataCollectionView.controller";
import verifyToken from "../middleware/authJWT";

const router = Router();

router.get("/workspaces/:workspaceId/dataCollectionViews", verifyToken, dataCollectionViewController.getDataCollectionViews);
router.get("/workspaces/:workspaceId/dataCollectionViews/row/:rowId", verifyToken, dataCollectionViewController.getDataCollectionViewsByRowId)
router.get("/workspaces/:workspaceId/dataCollectionViews/:dataCollectionViewId", verifyToken, dataCollectionViewController.getDataCollectionViewById)
router.post("/workspaces/:workspaceId/dataCollectionViews", verifyToken, dataCollectionViewController.createDataCollectionView);
router.put("/workspaces/:workspaceId/updateDataCollectionViews/", verifyToken, dataCollectionViewController.updateDataCollectionView);
router.delete("/workspaces/:workspaceId/deleteDataCollectionViews/:dataCollectionViewId", verifyToken, dataCollectionViewController.deleteDataCollectionView);


export default router;