import { Router } from "express";
import {
  listStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
} from "../controllers/studentController.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);

router.get("/", authorize("SUPER_ADMIN", "COLLEGE_ADMIN", "REGISTRAR", "TEACHER", "ACCOUNTANT"), listStudents);
router.get("/:id", getStudent);
router.post("/", authorize("SUPER_ADMIN", "COLLEGE_ADMIN", "REGISTRAR"), createStudent);
router.put("/:id", authorize("SUPER_ADMIN", "COLLEGE_ADMIN", "REGISTRAR"), updateStudent);
router.delete("/:id", authorize("SUPER_ADMIN", "COLLEGE_ADMIN", "REGISTRAR"), deleteStudent);

export default router;