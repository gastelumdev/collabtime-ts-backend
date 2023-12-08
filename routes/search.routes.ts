import { Router } from "express";
import * as searchController from "../controllers/search.controller"
import verifyToken from "../middleware/authJWT";

const router = Router();

router.post("/workspaces/:workspaceId/searchAll", verifyToken, searchController.searchAll);

export default router;