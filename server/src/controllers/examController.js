import prisma from "../config/prisma.js";
import { createAuditLog } from "../middleware/audit.js";

// Helper function to match score with grade scale
export const calculateGrade = async (score, maxScore = 100) => {
  const percentage = (score / maxScore) * 100;
  const scales = await prisma.gradeScale.findMany({ orderBy: { minScore: "desc" } });

  for (const scale of scales) {
    if (percentage >= scale.minScore && percentage <= scale.maxScore) {
      return {
        letterGrade: scale.letterGrade,
        gradePoint: scale.gpaPoint,
        percentage,
      };
    }
  }

  // Fallback
  return { letterGrade: "F", gradePoint: 0.0, percentage };
};

export const listExams = async (req, res) => {
  const { courseId, semesterId, examType } = req.query;
  const where = {};

  if (courseId) where.courseId = Number(courseId);
  if (semesterId) where.semesterId = Number(semesterId);
  if (examType) where.examType = examType;

  // Students can only see published exams
  if (req.user.role === "STUDENT") {
    where.isPublished = true;
  }

  const exams = await prisma.exam.findMany({
    where,
    include: {
      course: { select: { id: true, code: true, title: true, credits: true } },
      semester: { select: { id: true, name: true } },
      assessments: true,
      _count: { select: { marks: true } },
    },
    orderBy: { examDate: "desc" },
  });

  res.json(exams);
};

export const getExam = async (req, res) => {
  const examId = Number(req.params.id);

  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: {
      course: true,
      semester: true,
      assessments: true,
      marks: {
        where: req.user.role === "STUDENT" ? { studentId: req.user.student?.id, isPublished: true } : undefined,
        include: {
          student: {
            include: { user: { select: { name: true, email: true } } },
          },
          assessment: true,
        },
        orderBy: { student: { rollNo: "asc" } },
      },
    },
  });

  if (!exam) return res.status(404).json({ message: "Exam not found" });

  if (req.user.role === "STUDENT" && !exam.isPublished) {
    return res.status(403).json({ message: "Exam results have not been published yet." });
  }

  res.json(exam);
};

export const createExam = async (req, res) => {
  const {
    title,
    examType = "MIDTERM",
    courseId,
    semesterId,
    examDate,
    startTime,
    endTime,
    room,
    totalMarks = 100,
    weightagePercent = 30,
    assessments,
  } = req.body;

  const exam = await prisma.exam.create({
    data: {
      title,
      examType,
      courseId: Number(courseId),
      semesterId: semesterId ? Number(semesterId) : null,
      examDate: new Date(examDate),
      startTime,
      endTime,
      room,
      totalMarks: Number(totalMarks),
      weightagePercent: Number(weightagePercent),
      assessments:
        assessments && Array.isArray(assessments)
          ? {
              create: assessments.map((a) => ({
                title: a.title,
                maxMarks: Number(a.maxMarks) || 100,
                weightage: Number(a.weightage) || 100,
              })),
            }
          : undefined,
    },
    include: { course: true, assessments: true },
  });

  await createAuditLog({
    userId: req.user.id,
    action: "CREATE_EXAM",
    entity: "Exam",
    entityId: String(exam.id),
    details: { title, courseId },
    req,
  });

  res.status(201).json(exam);
};

export const enterMarks = async (req, res) => {
  const examId = Number(req.params.id);
  const { marks } = req.body; // Array of { studentId, enrollmentId, assessmentId, score, feedback }

  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: { course: true },
  });

  if (!exam) return res.status(404).json({ message: "Exam not found" });

  // Security: If teacher, verify they teach this course
  if (req.user.role === "TEACHER") {
    const assignment = await prisma.courseAssignment.findFirst({
      where: { courseId: exam.courseId, teacherId: req.user.teacher?.id },
    });
    if (!assignment) {
      return res.status(403).json({ message: "You are not assigned to teach this course" });
    }
  }

  const savedMarks = [];

  for (const m of marks) {
    const score = Number(m.score);
    if (score < 0 || score > exam.totalMarks) {
      return res.status(400).json({
        message: `Score ${score} is invalid. Must be between 0 and maximum total marks (${exam.totalMarks})`,
      });
    }

    const { letterGrade, gradePoint } = await calculateGrade(score, exam.totalMarks);

    const markRecord = await prisma.mark.upsert({
      where: {
        examId_studentId_assessmentId: {
          examId,
          studentId: Number(m.studentId),
          assessmentId: m.assessmentId ? Number(m.assessmentId) : null,
        },
      },
      update: {
        score,
        feedback: m.feedback || null,
        letterGrade,
        gradePoint,
        isPublished: exam.isPublished,
        recordedById: req.user.id,
      },
      create: {
        examId,
        studentId: Number(m.studentId),
        enrollmentId: Number(m.enrollmentId),
        assessmentId: m.assessmentId ? Number(m.assessmentId) : null,
        score,
        feedback: m.feedback || null,
        letterGrade,
        gradePoint,
        isPublished: exam.isPublished,
        recordedById: req.user.id,
      },
    });

    savedMarks.push(markRecord);
  }

  await createAuditLog({
    userId: req.user.id,
    action: "ENTER_MARKS",
    entity: "Exam",
    entityId: String(examId),
    details: { examTitle: exam.title, recordsCount: savedMarks.length },
    req,
  });

  res.json({ message: "Marks saved successfully", marks: savedMarks });
};

export const togglePublishExam = async (req, res) => {
  const examId = Number(req.params.id);
  const { isPublished } = req.body;

  const exam = await prisma.exam.update({
    where: { id: examId },
    data: {
      isPublished: Boolean(isPublished),
      publishedAt: isPublished ? new Date() : null,
      marks: {
        updateMany: {
          where: {},
          data: { isPublished: Boolean(isPublished) },
        },
      },
    },
  });

  await createAuditLog({
    userId: req.user.id,
    action: isPublished ? "PUBLISH_EXAM_RESULTS" : "UNPUBLISH_EXAM_RESULTS",
    entity: "Exam",
    entityId: String(examId),
    details: { title: exam.title, isPublished },
    req,
  });

  res.json(exam);
};

export const getStudentReportCard = async (req, res) => {
  const studentId = Number(req.params.studentId);

  if (req.user.role === "STUDENT" && req.user.student?.id !== studentId) {
    return res.status(403).json({ message: "You cannot access another student's transcript" });
  }

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      user: { select: { name: true, email: true } },
      department: true,
      program: true,
      enrollments: {
        include: {
          course: true,
          semester: true,
          marks: {
            where: { isPublished: true },
            include: { exam: true },
          },
        },
      },
    },
  });

  if (!student) return res.status(404).json({ message: "Student not found" });

  // Calculate semester-wise GPA and cumulative GPA (CGPA)
  let totalCredits = 0;
  let totalQualityPoints = 0;

  const coursesReport = student.enrollments.map((enrollment) => {
    const marks = enrollment.marks;
    const credits = enrollment.course.credits;
    let avgGradePoint = 0;
    let finalLetter = "Pending";

    if (marks.length > 0) {
      const avgScore = marks.reduce((acc, m) => acc + m.score, 0) / marks.length;
      avgGradePoint = marks.reduce((acc, m) => acc + (m.gradePoint || 0), 0) / marks.length;
      finalLetter = marks[0].letterGrade || "P";
      totalCredits += credits;
      totalQualityPoints += avgGradePoint * credits;
    }

    return {
      courseCode: enrollment.course.code,
      courseTitle: enrollment.course.title,
      credits,
      semester: enrollment.semester?.name || "Current",
      marksObtained: marks.map((m) => ({ exam: m.exam.title, score: m.score, letter: m.letterGrade })),
      gradePoint: avgGradePoint.toFixed(2),
      letterGrade: finalLetter,
    };
  });

  const cgpa = totalCredits > 0 ? (totalQualityPoints / totalCredits).toFixed(2) : "0.00";

  res.json({
    student: {
      id: student.id,
      name: student.user.name,
      rollNo: student.rollNo,
      department: student.department.name,
      program: student.program?.name,
      semester: student.semester,
    },
    coursesReport,
    totalCreditsEarned: totalCredits,
    cumulativeGpa: Number(cgpa),
    generatedAt: new Date(),
  });
};
