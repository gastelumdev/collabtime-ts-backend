import { Router } from "express";
import * as searchController from "../controllers/search.controller"
import verifyToken from "../middleware/authJWT";

const router = Router();

router.get("/getSearchContent", verifyToken, searchController.getSearchContent);
router.post("/workspaces/:workspaceId/searchAll", verifyToken, searchController.searchAll);
router.post("/workspaces/:workspaceId/searchTags", verifyToken, searchController.searchTags);

export default router;