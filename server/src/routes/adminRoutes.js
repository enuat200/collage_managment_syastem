import { Router } from "express";
import {
  listUsers,
  updateUserStatus,
  listAuditLogs,
  listGradeScales,
  updateGradeScale,
} from "../controllers/adminController.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);

router.get("/users", authorize("SUPER_ADMIN", "COLLEGE_ADMIN"), listUsers);
router.put("/users/:id/status", authorize("SUPER_ADMIN", "COLLEGE_ADMIN"), updateUserStatus);
router.get("/audit-logs", authorize("SUPER_ADMIN", "COLLEGE_ADMIN"), listAuditLogs);
router.get("/grade-scales", listGradeScales);
router.put("/grade-scales/:id", authorize("SUPER_ADMIN", "COLLEGE_ADMIN"), updateGradeScale);

export default router;
