import { Router } from "express";
import {
  listExams,
  getExam,
  createExam,
  enterMarks,
  togglePublishExam,
  getStudentReportCard,
} from "../controllers/examController.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);

router.get("/", listExams);
router.get("/:id", getExam);
router.post("/", authorize("SUPER_ADMIN", "COLLEGE_ADMIN", "REGISTRAR", "TEACHER"), createExam);
router.post("/:id/marks", authorize("SUPER_ADMIN", "COLLEGE_ADMIN", "REGISTRAR", "TEACHER"), enterMarks);
router.put("/:id/publish", authorize("SUPER_ADMIN", "COLLEGE_ADMIN", "REGISTRAR"), togglePublishExam);
router.get("/student/:studentId/report-card", getStudentReportCard);

export default router;
