import {Router} from "express";
import * as userController from '../controllers/auth.controller';

const router = Router()

router.post('/login', userController.login);
router.post('/register', userController.register);
router.get('/user/:id', userController.getUser);
router.post("/resetPasswordRequest", userController.resetPasswordRequest);
router.post("/resetPassword", userController.resetPassword);

export default router;