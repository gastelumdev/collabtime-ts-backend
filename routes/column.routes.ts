import { Router } from "express";
import * as columnController from "../controllers/column.controller";
import verifyToken from "../middleware/authJWT";

const router = Router();

router.get("/dataCollections/:dataCollectionId/columns", verifyToken, columnController.getColumns);
router.post("/dataCollections/:dataCollectionId/columns", verifyToken, columnController.createColumn);
router.post("/dataCollections/:dataCollectionId/columns/update/:id", verifyToken, columnController.updateColumn)
router.post("/dataCollections/:dataCollectionId/columns/delete/:id", verifyToken, columnController.deleteColumn)

export default router;