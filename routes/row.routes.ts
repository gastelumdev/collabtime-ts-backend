import { Router } from "express";
import * as rowController from "../controllers/row.controller";
import verifyToken from "../middleware/authJWT";
import { notesUpload } from "..";

const router = Router();

router.get("/workspaces/:workspaceId/dataCollections/:dataCollectionId/rows", verifyToken, rowController.getRows);
router.get("/workspaces/:workspaceId/dataCollections/:dataCollectionId/row/:rowId", verifyToken, rowController.getRow);
router.post("/workspaces/:workspaceId/dataCollections/:dataCollectionId/rows", verifyToken, rowController.createRow);
router.post("/workspaces/:workspaceId/dataCollections/:dataCollectionId/rows/update/:id", verifyToken, rowController.updateRow)
router.post("/workspaces/:workspaceId/dataCollections/:dataCollectionId/rows/delete/:id", verifyToken, rowController.deleteRow);
router.post("/workspaces/:workspaceId/dataCollections/:dataCollectionId/deleteRows", verifyToken, rowController.deleteRows);
router.post("/rows/callUpdate", verifyToken, rowController.callUpdate);
router.post("/rows/acknowledge/:rowId", verifyToken, rowController.acknowledgeRow);
router.post("/workspaces/:workspaceId/dataCollections/:dataCollectionId/rows/reorder", verifyToken, rowController.reorderRows);
router.get("/workspaces/:workspaceId/dataCollections/:dataCollectionId/getTotalRows", verifyToken, rowController.getTotalRows);
router.get("/dataCollections/:dataCollectionId/form", rowController.getFormData);
router.post("/dataCollections/:dataCollectionId/form", rowController.updateFormData)
router.post("/workspaces/:workspaceId/dataCollections/:dataCollectionId/getBlankRows", verifyToken, () => { })
// router.post("/migrateRows", rowController.migrateRows);
// router.post("/addReminder", rowController.addReminder);

export default router;