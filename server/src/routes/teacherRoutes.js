import { Router } from "express";
import {
  listTeachers,
  getTeacher,
  createTeacher,
  updateTeacher,
  deleteTeacher,
} from "../controllers/teacherController.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);

router.get("/", listTeachers);
router.get("/:id", getTeacher);
router.post("/", authorize("SUPER_ADMIN", "COLLEGE_ADMIN"), createTeacher);
router.put("/:id", authorize("SUPER_ADMIN", "COLLEGE_ADMIN"), updateTeacher);
router.delete("/:id", authorize("SUPER_ADMIN", "COLLEGE_ADMIN"), deleteTeacher);

export default router;