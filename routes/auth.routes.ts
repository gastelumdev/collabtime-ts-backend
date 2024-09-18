import { Router } from "express";
import * as userController from '../controllers/auth.controller';
import verifyToken from "../middleware/authJWT";

const router = Router()

router.post('/login', userController.login);
router.post('/register', userController.register);
router.get('/user/:id', verifyToken, userController.getUser);
router.post("/resetPasswordRequest", userController.resetPasswordRequest);
router.post("/resetPassword", userController.resetPassword);
router.get("/users", verifyToken, userController.getAllUsers);
router.put("/user/:id/update", verifyToken, userController.updateUser)

export default router;