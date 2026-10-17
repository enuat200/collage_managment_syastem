import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate, validateIdParam } from "../utils/validate.js";
import { departmentSchema } from "../utils/schemas.js";
import {
  listDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "../controllers/departmentController.js";

const router = Router();
router.param("id", validateIdParam);
router.use(authenticate);

router.get("/", listDepartments);
router.post("/", authorize("ADMIN"), validate(departmentSchema), createDepartment);
router.put("/:id", authorize("ADMIN"), validate(departmentSchema), updateDepartment);
router.delete("/:id", authorize("ADMIN"), deleteDepartment);

export default router;