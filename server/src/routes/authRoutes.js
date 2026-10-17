import { Router } from "express";
import {
  login,
  me,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/me", authenticate, me);
router.put("/profile", authenticate, updateProfile);
router.post("/change-password", authenticate, changePassword);

export default router;