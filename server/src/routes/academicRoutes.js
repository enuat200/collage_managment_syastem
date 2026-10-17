import { Router } from "express";
import {
  listDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  listPrograms,
  createProgram,
  updateProgram,
  deleteProgram,
  listAcademicYears,
  createAcademicYear,
  listSemesters,
  createSemester,
  listCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  listSections,
  createSection,
  assignTeacher,
  removeAssignment,
  listEnrollments,
  enrollStudent,
  deleteEnrollment,
  listTimetables,
  createTimetable,
  deleteTimetable,
} from "../controllers/academicController.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);

// Departments
router.get("/departments", listDepartments);
router.post("/departments", authorize("SUPER_ADMIN", "COLLEGE_ADMIN"), createDepartment);
router.put("/departments/:id", authorize("SUPER_ADMIN", "COLLEGE_ADMIN"), updateDepartment);
router.delete("/departments/:id", authorize("SUPER_ADMIN", "COLLEGE_ADMIN"), deleteDepartment);

// Programs
router.get("/programs", listPrograms);
router.post("/programs", authorize("SUPER_ADMIN", "COLLEGE_ADMIN"), createProgram);
router.put("/programs/:id", authorize("SUPER_ADMIN", "COLLEGE_ADMIN"), updateProgram);
router.delete("/programs/:id", authorize("SUPER_ADMIN", "COLLEGE_ADMIN"), deleteProgram);

// Academic Years & Semesters
router.get("/academic-years", listAcademicYears);
router.post("/academic-years", authorize("SUPER_ADMIN", "COLLEGE_ADMIN", "REGISTRAR"), createAcademicYear);
router.get("/semesters", listSemesters);
router.post("/semesters", authorize("SUPER_ADMIN", "COLLEGE_ADMIN", "REGISTRAR"), createSemester);

// Courses
router.get("/courses", listCourses);
router.post("/courses", authorize("SUPER_ADMIN", "COLLEGE_ADMIN", "REGISTRAR"), createCourse);
router.put("/courses/:id", authorize("SUPER_ADMIN", "COLLEGE_ADMIN", "REGISTRAR"), updateCourse);
router.delete("/courses/:id", authorize("SUPER_ADMIN", "COLLEGE_ADMIN"), deleteCourse);

// Sections
router.get("/sections", listSections);
router.post("/sections", authorize("SUPER_ADMIN", "COLLEGE_ADMIN", "REGISTRAR"), createSection);

// Teacher Course Assignments
router.post("/assignments", authorize("SUPER_ADMIN", "COLLEGE_ADMIN", "REGISTRAR"), assignTeacher);
router.delete("/assignments/:id", authorize("SUPER_ADMIN", "COLLEGE_ADMIN", "REGISTRAR"), removeAssignment);

// Student Course Enrollments
router.get("/enrollments", listEnrollments);
router.post("/enrollments", authorize("SUPER_ADMIN", "COLLEGE_ADMIN", "REGISTRAR"), enrollStudent);
router.delete("/enrollments/:id", authorize("SUPER_ADMIN", "COLLEGE_ADMIN", "REGISTRAR"), deleteEnrollment);

// Timetables
router.get("/timetables", listTimetables);
router.post("/timetables", authorize("SUPER_ADMIN", "COLLEGE_ADMIN", "REGISTRAR"), createTimetable);
router.delete("/timetables/:id", authorize("SUPER_ADMIN", "COLLEGE_ADMIN", "REGISTRAR"), deleteTimetable);

export default router;
