import { Router } from "express";
import {
  getEnrollmentReport,
  getAttendanceReport,
  getAcademicReport,
  getFinancialReport,
  getLibraryReport,
} from "../controllers/reportController.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);

router.get("/enrollment", authorize("SUPER_ADMIN", "COLLEGE_ADMIN", "REGISTRAR"), getEnrollmentReport);
router.get("/attendance", authorize("SUPER_ADMIN", "COLLEGE_ADMIN", "REGISTRAR", "TEACHER"), getAttendanceReport);
router.get("/academic", authorize("SUPER_ADMIN", "COLLEGE_ADMIN", "REGISTRAR", "TEACHER"), getAcademicReport);
router.get("/financial", authorize("SUPER_ADMIN", "COLLEGE_ADMIN", "ACCOUNTANT"), getFinancialReport);
router.get("/library", authorize("SUPER_ADMIN", "COLLEGE_ADMIN", "LIBRARIAN"), getLibraryReport);

export default router;
