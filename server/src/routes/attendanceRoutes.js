import { Router } from "express";
import {
  listSessions,
  getSessionWithRecords,
  createSessionWithRecords,
  updateRecord,
  getStudentAttendanceSummary,
} from "../controllers/attendanceController.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);

router.get("/sessions", listSessions);
router.get("/sessions/:id", getSessionWithRecords);
router.post("/sessions", authorize("SUPER_ADMIN", "COLLEGE_ADMIN", "REGISTRAR", "TEACHER"), createSessionWithRecords);
router.put("/records/:id", authorize("SUPER_ADMIN", "COLLEGE_ADMIN", "TEACHER"), updateRecord);
router.get("/student/:studentId", getStudentAttendanceSummary);

export default router;
