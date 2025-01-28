import { Router } from "express";
import * as resourcePlanningController from '../../controllers/apps/resourcePlanning.controller';
import verifyToken from "../../middleware/authJWT";
const router = Router();

router.get("/rows/:rowId", verifyToken, resourcePlanningController.getProject);
router.get("/workspaces/:workspaceId/project/:projectId/getBillOfMaterialsParts", verifyToken, resourcePlanningController.getBillOfMaterialsParts)
router.get("/workspaces/:workspaceId/billOfMaterialsView", verifyToken, resourcePlanningController.getBillOfMaterialsView);
router.get("/workspaces/:workspaceId/parts", verifyToken, resourcePlanningController.getParts);
router.get("/workspaces/:workspaceId/partsColumns", verifyToken, resourcePlanningController.getPartsColumns);
router.put("/workspaces/:workspaceId/updateBillOfMaterialsPartValues", verifyToken, resourcePlanningController.updateBillOfMaterialPartValues)

export default router;
