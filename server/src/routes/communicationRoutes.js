import { Router } from "express";
import {
  listAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../controllers/communicationController.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);

// Announcements
router.get("/announcements", listAnnouncements);
router.post("/announcements", authorize("SUPER_ADMIN", "COLLEGE_ADMIN", "TEACHER", "REGISTRAR", "LIBRARIAN"), createAnnouncement);
router.delete("/announcements/:id", authorize("SUPER_ADMIN", "COLLEGE_ADMIN"), deleteAnnouncement);

// Notifications
router.get("/notifications", listNotifications);
router.put("/notifications/:id/read", markNotificationRead);
router.put("/notifications/read-all", markAllNotificationsRead);

export default router;
