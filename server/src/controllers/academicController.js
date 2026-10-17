import prisma from "../config/prisma.js";
import { createAuditLog } from "../middleware/audit.js";

// ==================== DEPARTMENTS ====================
export const listDepartments = async (req, res) => {
  const departments = await prisma.department.findMany({
    include: {
      _count: { select: { students: true, teachers: true, courses: true, programs: true } },
    },
    orderBy: { name: "asc" },
  });
  res.json(departments);
};

export const createDepartment = async (req, res) => {
  const { name, code, description, headOfDepartment } = req.body;
  const dept = await prisma.department.create({
    data: { name, code: code.toUpperCase(), description, headOfDepartment },
  });
  res.status(201).json(dept);
};

export const updateDepartment = async (req, res) => {
  const { name, code, description, headOfDepartment } = req.body;
  const dept = await prisma.department.update({
    where: { id: Number(req.params.id) },
    data: {
      name,
      code: code ? code.toUpperCase() : undefined,
      description,
      headOfDepartment,
    },
  });
  res.json(dept);
};

export const deleteDepartment = async (req, res) => {
  await prisma.department.delete({ where: { id: Number(req.params.id) } });
  res.json({ message: "Department deleted successfully" });
};

// ==================== PROGRAMS ====================
export const listPrograms = async (req, res) => {
  const { departmentId } = req.query;
  const where = departmentId ? { departmentId: Number(departmentId) } : {};
  const programs = await prisma.program.findMany({
    where,
    include: {
      department: { select: { id: true, name: true, code: true } },
      _count: { select: { students: true, courses: true } },
    },
    orderBy: { name: "asc" },
  });
  res.json(programs);
};

export const createProgram = async (req, res) => {
  const { name, code, departmentId, degreeType, durationYears, totalCredits } = req.body;
  const prog = await prisma.program.create({
    data: {
      name,
      code: code.toUpperCase(),
      departmentId: Number(departmentId),
      degreeType: degreeType || "B.Sc.",
      durationYears: Number(durationYears) || 4,
      totalCredits: Number(totalCredits) || 120,
    },
    include: { department: true },
  });
  res.status(201).json(prog);
};

export const updateProgram = async (req, res) => {
  const { name, code, departmentId, degreeType, durationYears, totalCredits } = req.body;
  const prog = await prisma.program.update({
    where: { id: Number(req.params.id) },
    data: {
      name,
      code: code ? code.toUpperCase() : undefined,
      departmentId: departmentId ? Number(departmentId) : undefined,
      degreeType,
      durationYears: durationYears ? Number(durationYears) : undefined,
      totalCredits: totalCredits ? Number(totalCredits) : undefined,
    },
    include: { department: true },
  });
  res.json(prog);
};

export const deleteProgram = async (req, res) => {
  await prisma.program.delete({ where: { id: Number(req.params.id) } });
  res.json({ message: "Program deleted successfully" });
};

// ==================== ACADEMIC YEARS & SEMESTERS ====================
export const listAcademicYears = async (req, res) => {
  const years = await prisma.academicYear.findMany({
    include: { semesters: { orderBy: { term: "asc" } } },
    orderBy: { year: "desc" },
  });
  res.json(years);
};

export const createAcademicYear = async (req, res) => {
  const { year, startDate, endDate, isCurrent } = req.body;
  const ay = await prisma.academicYear.create({
    data: {
      year,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isCurrent: Boolean(isCurrent),
    },
  });
  res.status(201).json(ay);
};

export const listSemesters = async (req, res) => {
  const semesters = await prisma.semester.findMany({
    include: { academicYear: true },
    orderBy: { startDate: "desc" },
  });
  res.json(semesters);
};

export const createSemester = async (req, res) => {
  const { name, academicYearId, term, startDate, endDate, isCurrent } = req.body;
  const sem = await prisma.semester.create({
    data: {
      name,
      academicYearId: Number(academicYearId),
      term: Number(term) || 1,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isCurrent: Boolean(isCurrent),
    },
  });
  res.status(201).json(sem);
};

// ==================== COURSES ====================
export const listCourses = async (req, res) => {
  const { departmentId, programId, search } = req.query;
  const where = {};

  if (departmentId) where.departmentId = Number(departmentId);
  if (programId) where.programId = Number(programId);
  if (search) {
    where.OR = [
      { code: { contains: search, mode: "insensitive" } },
      { title: { contains: search, mode: "insensitive" } },
    ];
  }

  const courses = await prisma.course.findMany({
    where,
    include: {
      department: { select: { id: true, name: true, code: true } },
      program: { select: { id: true, name: true, code: true } },
      courseAssignments: {
        include: {
          teacher: {
            include: { user: { select: { name: true, email: true } } },
          },
          section: true,
        },
      },
      _count: { select: { enrollments: true } },
    },
    orderBy: { code: "asc" },
  });

  res.json(courses);
};

export const createCourse = async (req, res) => {
  const { code, title, description, credits = 3, departmentId, programId, syllabus } = req.body;
  const course = await prisma.course.create({
    data: {
      code: code.toUpperCase(),
      title,
      description,
      credits: Number(credits),
      departmentId: Number(departmentId),
      programId: programId ? Number(programId) : null,
      syllabus,
    },
    include: { department: true, program: true },
  });
  res.status(201).json(course);
};

export const updateCourse = async (req, res) => {
  const { code, title, description, credits, departmentId, programId, syllabus } = req.body;
  const course = await prisma.course.update({
    where: { id: Number(req.params.id) },
    data: {
      code: code ? code.toUpperCase() : undefined,
      title,
      description,
      credits: credits ? Number(credits) : undefined,
      departmentId: departmentId ? Number(departmentId) : undefined,
      programId: programId !== undefined ? (programId ? Number(programId) : null) : undefined,
      syllabus,
    },
    include: { department: true, program: true },
  });
  res.json(course);
};

export const deleteCourse = async (req, res) => {
  await prisma.course.delete({ where: { id: Number(req.params.id) } });
  res.json({ message: "Course deleted successfully" });
};

// ==================== SECTIONS ====================
export const listSections = async (req, res) => {
  const { semesterId } = req.query;
  const where = semesterId ? { semesterId: Number(semesterId) } : {};
  const sections = await prisma.section.findMany({
    where,
    include: {
      semester: true,
      _count: { select: { enrollments: true, timetables: true } },
    },
    orderBy: { name: "asc" },
  });
  res.json(sections);
};

export const createSection = async (req, res) => {
  const { name, semesterId, maxCapacity = 40, room } = req.body;
  const section = await prisma.section.create({
    data: {
      name,
      semesterId: semesterId ? Number(semesterId) : null,
      maxCapacity: Number(maxCapacity),
      room,
    },
  });
  res.status(201).json(section);
};

// ==================== COURSE ASSIGNMENTS ====================
export const assignTeacher = async (req, res) => {
  const { teacherId, courseId, sectionId, role = "PRIMARY" } = req.body;

  const assignment = await prisma.courseAssignment.upsert({
    where: {
      teacherId_courseId_sectionId: {
        teacherId: Number(teacherId),
        courseId: Number(courseId),
        sectionId: sectionId ? Number(sectionId) : null,
      },
    },
    update: { role },
    create: {
      teacherId: Number(teacherId),
      courseId: Number(courseId),
      sectionId: sectionId ? Number(sectionId) : null,
      role,
    },
    include: {
      teacher: { include: { user: { select: { name: true } } } },
      course: true,
      section: true,
    },
  });

  res.status(201).json(assignment);
};

export const removeAssignment = async (req, res) => {
  await prisma.courseAssignment.delete({ where: { id: Number(req.params.id) } });
  res.json({ message: "Course assignment removed" });
};

// ==================== ENROLLMENTS ====================
export const listEnrollments = async (req, res) => {
  const { courseId, studentId, semesterId } = req.query;
  const where = {};
  if (courseId) where.courseId = Number(courseId);
  if (studentId) where.studentId = Number(studentId);
  if (semesterId) where.semesterId = Number(semesterId);

  const enrollments = await prisma.enrollment.findMany({
    where,
    include: {
      student: { include: { user: { select: { name: true, email: true } }, department: true } },
      course: true,
      section: true,
      semester: true,
      marks: true,
    },
    orderBy: { enrollmentDate: "desc" },
  });

  res.json(enrollments);
};

export const enrollStudent = async (req, res) => {
  const { studentId, courseId, semesterId, sectionId } = req.body;

  // Check duplicate enrollment
  const existing = await prisma.enrollment.findFirst({
    where: {
      studentId: Number(studentId),
      courseId: Number(courseId),
      semesterId: semesterId ? Number(semesterId) : null,
    },
  });

  if (existing) {
    return res.status(409).json({ message: "Student is already enrolled in this course for this semester" });
  }

  const enrollment = await prisma.enrollment.create({
    data: {
      studentId: Number(studentId),
      courseId: Number(courseId),
      semesterId: semesterId ? Number(semesterId) : null,
      sectionId: sectionId ? Number(sectionId) : null,
      status: "ENROLLED",
    },
    include: {
      student: { include: { user: { select: { name: true } } } },
      course: true,
      section: true,
    },
  });

  await createAuditLog({
    userId: req.user.id,
    action: "ENROLL_STUDENT",
    entity: "Enrollment",
    entityId: String(enrollment.id),
    details: { studentId, courseId, semesterId },
    req,
  });

  res.status(201).json(enrollment);
};

export const deleteEnrollment = async (req, res) => {
  await prisma.enrollment.delete({ where: { id: Number(req.params.id) } });
  res.json({ message: "Student unenrolled successfully" });
};

// ==================== TIMETABLES & CONFLICT DETECTION ====================
export const listTimetables = async (req, res) => {
  const { courseId, sectionId, day } = req.query;
  const where = {};
  if (courseId) where.courseId = Number(courseId);
  if (sectionId) where.sectionId = Number(sectionId);
  if (day) where.day = day;

  const timetables = await prisma.timetable.findMany({
    where,
    include: {
      course: {
        include: {
          department: true,
          courseAssignments: {
            include: { teacher: { include: { user: { select: { name: true } } } } },
          },
        },
      },
      section: true,
    },
    orderBy: [{ day: "asc" }, { startTime: "asc" }],
  });

  res.json(timetables);
};

export const createTimetable = async (req, res) => {
  const { courseId, sectionId, day, startTime, endTime, room, building } = req.body;

  // Conflict Detection 1: Room conflict on the same day and overlapping time
  const roomConflict = await prisma.timetable.findFirst({
    where: {
      day,
      room,
      OR: [
        { AND: [{ startTime: { lte: startTime } }, { endTime: { gt: startTime } }] },
        { AND: [{ startTime: { lt: endTime } }, { endTime: { gte: endTime } }] },
      ],
    },
    include: { course: true },
  });

  if (roomConflict) {
    return res.status(409).json({
      message: `Timetable conflict: Room '${room}' is already booked on ${day} (${roomConflict.startTime} - ${roomConflict.endTime}) for course ${roomConflict.course.code}`,
    });
  }

  // Conflict Detection 2: Section conflict on the same day and overlapping time
  if (sectionId) {
    const sectionConflict = await prisma.timetable.findFirst({
      where: {
        day,
        sectionId: Number(sectionId),
        OR: [
          { AND: [{ startTime: { lte: startTime } }, { endTime: { gt: startTime } }] },
          { AND: [{ startTime: { lt: endTime } }, { endTime: { gte: endTime } }] },
        ],
      },
      include: { course: true, section: true },
    });

    if (sectionConflict) {
      return res.status(409).json({
        message: `Timetable conflict: Section '${sectionConflict.section?.name}' already has a class on ${day} (${sectionConflict.startTime} - ${sectionConflict.endTime}) for ${sectionConflict.course.code}`,
      });
    }
  }

  const slot = await prisma.timetable.create({
    data: {
      courseId: Number(courseId),
      sectionId: sectionId ? Number(sectionId) : null,
      day,
      startTime,
      endTime,
      room,
      building,
    },
    include: { course: true, section: true },
  });

  res.status(201).json(slot);
};

export const deleteTimetable = async (req, res) => {
  await prisma.timetable.delete({ where: { id: Number(req.params.id) } });
  res.json({ message: "Timetable slot deleted successfully" });
};
