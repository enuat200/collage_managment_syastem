import prisma from "../config/prisma.js";
import { createAuditLog } from "../middleware/audit.js";

export const listSessions = async (req, res) => {
  const { courseId, sectionId, date, teacherId } = req.query;
  const where = {};

  if (courseId) where.courseId = Number(courseId);
  if (sectionId) where.sectionId = Number(sectionId);
  if (teacherId) where.teacherId = Number(teacherId);
  if (date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    where.date = { gte: start, lte: end };
  }

  // If logged in as Teacher, default or restrict to their own courses
  if (req.user.role === "TEACHER" && req.user.teacher) {
    where.teacherId = req.user.teacher.id;
  }

  const sessions = await prisma.attendanceSession.findMany({
    where,
    include: {
      course: { select: { id: true, code: true, title: true } },
      section: { select: { id: true, name: true } },
      teacher: { include: { user: { select: { name: true } } } },
      _count: { select: { records: true } },
    },
    orderBy: { date: "desc" },
  });

  res.json(sessions);
};

export const getSessionWithRecords = async (req, res) => {
  const sessionId = Number(req.params.id);

  const session = await prisma.attendanceSession.findUnique({
    where: { id: sessionId },
    include: {
      course: true,
      section: true,
      teacher: { include: { user: { select: { name: true } } } },
      records: {
        include: {
          student: {
            include: { user: { select: { name: true, email: true } } },
          },
        },
        orderBy: { student: { rollNo: "asc" } },
      },
    },
  });

  if (!session) return res.status(404).json({ message: "Attendance session not found" });

  res.json(session);
};

export const createSessionWithRecords = async (req, res) => {
  const { courseId, sectionId, date, startTime, endTime, topic, room, records } = req.body;

  // Verify teacher identity
  let teacherId;
  if (req.user.role === "TEACHER") {
    if (!req.user.teacher) return res.status(403).json({ message: "Teacher profile not linked" });
    teacherId = req.user.teacher.id;
  } else {
    teacherId = req.body.teacherId ? Number(req.body.teacherId) : null;
    if (!teacherId) {
      // Find assigned teacher or fallback
      const assignment = await prisma.courseAssignment.findFirst({
        where: { courseId: Number(courseId) },
      });
      teacherId = assignment?.teacherId;
    }
  }

  if (!teacherId) {
    return res.status(400).json({ message: "A valid teacher must be associated with the attendance session" });
  }

  const sessionDate = date ? new Date(date) : new Date();

  // Create session and batch records in a transaction
  const result = await prisma.$transaction(async (tx) => {
    const session = await tx.attendanceSession.create({
      data: {
        courseId: Number(courseId),
        sectionId: sectionId ? Number(sectionId) : null,
        teacherId: Number(teacherId),
        date: sessionDate,
        startTime,
        endTime,
        topic,
        room,
      },
    });

    if (records && Array.isArray(records) && records.length > 0) {
      for (const rec of records) {
        await tx.attendanceRecord.create({
          data: {
            sessionId: session.id,
            studentId: Number(rec.studentId),
            enrollmentId: rec.enrollmentId ? Number(rec.enrollmentId) : null,
            status: rec.status || "PRESENT",
            remarks: rec.remarks || null,
            recordedById: req.user.id,
          },
        });
      }
    }

    return session;
  });

  await createAuditLog({
    userId: req.user.id,
    action: "TAKE_ATTENDANCE",
    entity: "AttendanceSession",
    entityId: String(result.id),
    details: { courseId, studentCount: records?.length || 0, date: sessionDate },
    req,
  });

  res.status(201).json(result);
};

export const updateRecord = async (req, res) => {
  const recordId = Number(req.params.id);
  const { status, remarks } = req.body;

  const existing = await prisma.attendanceRecord.findUnique({
    where: { id: recordId },
    include: { session: true },
  });

  if (!existing) return res.status(404).json({ message: "Attendance record not found" });

  // Security check: If teacher, verify they teach this course
  if (req.user.role === "TEACHER") {
    if (existing.session.teacherId !== req.user.teacher?.id) {
      return res.status(403).json({ message: "You are not authorized to edit attendance for this class" });
    }
  }

  const updated = await prisma.attendanceRecord.update({
    where: { id: recordId },
    data: {
      status,
      remarks,
      recordedById: req.user.id,
    },
  });

  await createAuditLog({
    userId: req.user.id,
    action: "UPDATE_ATTENDANCE_RECORD",
    entity: "AttendanceRecord",
    entityId: String(recordId),
    details: { previousStatus: existing.status, newStatus: status, remarks },
    req,
  });

  res.json(updated);
};

export const getStudentAttendanceSummary = async (req, res) => {
  const studentId = Number(req.params.studentId);

  // Privacy check
  if (req.user.role === "STUDENT" && req.user.student?.id !== studentId) {
    return res.status(403).json({ message: "Access denied to other students' attendance records" });
  }

  const records = await prisma.attendanceRecord.findMany({
    where: { studentId },
    include: {
      session: {
        include: { course: true, teacher: { include: { user: { select: { name: true } } } } },
      },
    },
    orderBy: { session: { date: "desc" } },
  });

  const total = records.length;
  const present = records.filter((r) => r.status === "PRESENT").length;
  const late = records.filter((r) => r.status === "LATE").length;
  const excused = records.filter((r) => r.status === "EXCUSED").length;
  const absent = records.filter((r) => r.status === "ABSENT").length;

  const effectivePresent = present + excused + late * 0.5;
  const percentage = total > 0 ? ((effectivePresent / total) * 100).toFixed(1) : "100.0";

  res.json({
    studentId,
    totalSessions: total,
    present,
    late,
    excused,
    absent,
    percentage: Number(percentage),
    records,
  });
};
