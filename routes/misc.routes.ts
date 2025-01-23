import { Request, Response, Router } from 'express';
import verifyToken from "../middleware/authJWT";
import * as miscController from '../controllers/misc.controller';

const router = Router();

router.get('/purchaseOrder', miscController.purchaseOrder);

export default router;