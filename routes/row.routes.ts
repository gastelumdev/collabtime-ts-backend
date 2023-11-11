import { Router } from "express";
import * as rowController from "../controllers/row.controller";
import verifyToken from "../middleware/authJWT";

const router = Router();

router.get("/dataCollections/:dataCollectionId/rows", verifyToken, rowController.getRows);
router.post("/dataCollections/:dataCollectionId/rows", verifyToken, rowController.createRow);
router.post("/dataCollections/:dataCollectionId/rows/delete/:id", verifyToken, rowController.deleteRow);

export default router;