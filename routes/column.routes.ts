import { Router } from "express";
import * as columnController from "../controllers/column.controller";
import verifyToken from "../middleware/authJWT";

const router = Router();

router.get("/workspaces/:workspaceId/dataCollections/:dataCollectionId/columns", verifyToken, columnController.getColumns);
router.post("/workspaces/:workspaceId/dataCollections/:dataCollectionId/columns", verifyToken, columnController.createColumn);
router.post("/workspaces/:workspaceId/dataCollections/:dataCollectionId/columns/update/:id", verifyToken, columnController.updateColumn)
router.post("/workspaces/:workspaceId/dataCollections/:dataCollectionId/columns/delete", verifyToken, columnController.deleteColumn)
router.post("/workspaces/:workspaceId/dataCollections/:dataCollectionId/columns/reorderColumns", verifyToken, columnController.reorderColumns)

export default router;