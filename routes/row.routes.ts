import { Router } from "express";
import * as rowController from "../controllers/row.controller";
import verifyToken from "../middleware/authJWT";
import { notesUpload } from "..";

const router = Router();

router.get("/workspaces/:workspaceId/dataCollections/:dataCollectionId/rows", verifyToken, rowController.getRows);
router.post("/workspaces/:workspaceId/dataCollections/:dataCollectionId/rows", verifyToken, rowController.createRow);
router.post("/workspaces/:workspaceId/dataCollections/:dataCollectionId/rows/update/:id", verifyToken, rowController.updateRow)
router.post("/workspaces/:workspaceId/dataCollections/:dataCollectionId/rows/delete/:id", verifyToken, rowController.deleteRow);
router.post("/workspaces/:workspaceId/dataCollections/:dataCollectionId/deleteRows", verifyToken, rowController.deleteRows);
router.post("/rows/callUpdate", verifyToken, rowController.callUpdate);
router.post("/rows/acknowledge/:rowId", verifyToken, rowController.acknowledgeRow);
router.get("/workspaces/:workspaceId/dataCollections/:dataCollectionId/getTotalRows", verifyToken, rowController.getTotalRows);
// router.post("/migrateRows", rowController.migrateRows);
// router.post("/addReminder", rowController.addReminder);

export default router;