import { Router } from "express";
import {
  listStaff,
  createStaff,
  updateStaff,
  deleteStaff,
} from "../controllers/staffController.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);

router.get("/", authorize("SUPER_ADMIN", "COLLEGE_ADMIN", "REGISTRAR"), listStaff);
router.post("/", authorize("SUPER_ADMIN", "COLLEGE_ADMIN"), createStaff);
router.put("/:id", authorize("SUPER_ADMIN", "COLLEGE_ADMIN"), updateStaff);
router.delete("/:id", authorize("SUPER_ADMIN", "COLLEGE_ADMIN"), deleteStaff);

export default router;
