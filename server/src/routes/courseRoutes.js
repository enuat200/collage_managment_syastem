import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate, validateIdParam } from "../utils/validate.js";
import { courseSchema, courseUpdateSchema } from "../utils/schemas.js";
import {
  listCourses,
  createCourse,
  updateCourse,
  deleteCourse,
} from "../controllers/courseController.js";

const router = Router();
router.param("id", validateIdParam);
router.use(authenticate);

router.get("/", listCourses);
router.post("/", authorize("ADMIN"), validate(courseSchema), createCourse);
router.put("/:id", authorize("ADMIN"), validate(courseUpdateSchema), updateCourse);
router.delete("/:id", authorize("ADMIN"), deleteCourse);

export default router;