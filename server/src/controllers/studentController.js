import bcrypt from "bcryptjs";
import prisma from "../config/prisma.js";
import { createAuditLog } from "../middleware/audit.js";

const studentSelect = {
  id: true,
  rollNo: true,
  semester: true,
  admissionDate: true,
  dateOfBirth: true,
  gender: true,
  bloodGroup: true,
  address: true,
  emergencyContactName: true,
  emergencyContactPhone: true,
  enrollmentStatus: true,
  createdAt: true,
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      avatarUrl: true,
      isActive: true,
    },
  },
  department: { select: { id: true, name: true, code: true } },
  program: { select: { id: true, name: true, code: true } },
};

export const listStudents = async (req, res) => {
  const {
    search,
    departmentId,
    programId,
    semester,
    status,
    page = 1,
    limit = 10,
    sortBy = "rollNo",
    sortOrder = "asc",
  } = req.query;

  const where = {};

  if (search) {
    where.OR = [
      { rollNo: { contains: search, mode: "insensitive" } },
      { user: { name: { contains: search, mode: "insensitive" } } },
      { user: { email: { contains: search, mode: "insensitive" } } },
    ];
  }

  if (departmentId) where.departmentId = Number(departmentId);
  if (programId) where.programId = Number(programId);
  if (semester) where.semester = Number(semester);
  if (status) where.enrollmentStatus = status;

  const take = Math.min(Number(limit) || 10, 100);
  const skip = (Math.max(Number(page) || 1, 1) - 1) * take;

  const [total, students] = await Promise.all([
    prisma.student.count({ where }),
    prisma.student.findMany({
      where,
      select: studentSelect,
      orderBy: sortBy === "name" ? { user: { name: sortOrder } } : { [sortBy]: sortOrder },
      take,
      skip,
    }),
  ]);

  res.json({
    data: students,
    pagination: {
      total,
      page: Number(page) || 1,
      limit: take,
      totalPages: Math.ceil(total / take) || 1,
    },
  });
};

export const getStudent = async (req, res) => {
  const student = await prisma.student.findUnique({
    where: { id: Number(req.params.id) },
    select: {
      ...studentSelect,
      enrollments: {
        include: {
          course: true,
          semester: true,
          section: true,
          marks: { include: { exam: true } },
        },
      },
      invoices: {
        include: {
          feeItems: true,
          payments: true,
        },
      },
      attendanceRecords: {
        include: {
          session: { include: { course: true } },
        },
        orderBy: { session: { date: "desc" } },
        take: 20,
      },
      bookLoans: {
        include: { book: true },
        orderBy: { borrowDate: "desc" },
      },
    },
  });

  if (!student) return res.status(404).json({ message: "Student not found" });

  // Privacy check: Students can only view their own profile
  if (req.user.role === "STUDENT" && req.user.student?.id !== student.id) {
    return res.status(403).json({ message: "You cannot access another student's record" });
  }

  res.json(student);
};

export const createStudent = async (req, res) => {
  const {
    name,
    email,
    password = "Student@123",
    rollNo,
    departmentId,
    programId,
    semester = 1,
    phone,
    dateOfBirth,
    gender,
    bloodGroup,
    address,
    emergencyContactName,
    emergencyContactPhone,
  } = req.body;

  const existingEmail = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existingEmail) {
    return res.status(409).json({ message: "A user with this email address already exists" });
  }

  // Generate rollNo if not provided
  let studentRollNo = rollNo;
  if (!studentRollNo) {
    const year = new Date().getFullYear();
    const count = await prisma.student.count();
    studentRollNo = `STU-${year}-${String(count + 1).padStart(4, "0")}`;
  }

  const existingRollNo = await prisma.student.findUnique({ where: { rollNo: studentRollNo } });
  if (existingRollNo) {
    return res.status(409).json({ message: "A student with this Roll/Student ID already exists" });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const student = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
        role: "STUDENT",
        phone,
      },
    });

    return tx.student.create({
      data: {
        userId: user.id,
        rollNo: studentRollNo,
        departmentId: Number(departmentId),
        programId: programId ? Number(programId) : null,
        semester: Number(semester),
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        gender,
        bloodGroup,
        address,
        emergencyContactName,
        emergencyContactPhone,
      },
      select: studentSelect,
    });
  });

  await createAuditLog({
    userId: req.user.id,
    action: "CREATE_STUDENT",
    entity: "Student",
    entityId: String(student.id),
    details: { rollNo: student.rollNo, name: student.user.name },
    req,
  });

  res.status(201).json(student);
};

export const updateStudent = async (req, res) => {
  const id = Number(req.params.id);
  const {
    name,
    email,
    password,
    phone,
    rollNo,
    departmentId,
    programId,
    semester,
    enrollmentStatus,
    dateOfBirth,
    gender,
    bloodGroup,
    address,
    emergencyContactName,
    emergencyContactPhone,
  } = req.body;

  const existing = await prisma.student.findUnique({ where: { id }, select: { userId: true } });
  if (!existing) return res.status(404).json({ message: "Student not found" });

  const userData = {};
  if (name) userData.name = name;
  if (email) userData.email = email.toLowerCase();
  if (phone !== undefined) userData.phone = phone;
  if (password) userData.passwordHash = await bcrypt.hash(password, 10);

  const student = await prisma.$transaction(async (tx) => {
    if (Object.keys(userData).length) {
      await tx.user.update({
        where: { id: existing.userId },
        data: userData,
      });
    }

    return tx.student.update({
      where: { id },
      data: {
        rollNo: rollNo !== undefined ? rollNo : undefined,
        departmentId: departmentId ? Number(departmentId) : undefined,
        programId: programId !== undefined ? (programId ? Number(programId) : null) : undefined,
        semester: semester !== undefined ? Number(semester) : undefined,
        enrollmentStatus: enrollmentStatus || undefined,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        gender: gender !== undefined ? gender : undefined,
        bloodGroup: bloodGroup !== undefined ? bloodGroup : undefined,
        address: address !== undefined ? address : undefined,
        emergencyContactName: emergencyContactName !== undefined ? emergencyContactName : undefined,
        emergencyContactPhone: emergencyContactPhone !== undefined ? emergencyContactPhone : undefined,
      },
      select: studentSelect,
    });
  });

  await createAuditLog({
    userId: req.user.id,
    action: "UPDATE_STUDENT",
    entity: "Student",
    entityId: String(id),
    details: { rollNo: student.rollNo },
    req,
  });

  res.json(student);
};

export const deleteStudent = async (req, res) => {
  const id = Number(req.params.id);
  const student = await prisma.student.findUnique({
    where: { id },
    select: { userId: true, rollNo: true },
  });
  if (!student) return res.status(404).json({ message: "Student not found" });

  await prisma.user.delete({ where: { id: student.userId } });

  await createAuditLog({
    userId: req.user.id,
    action: "DELETE_STUDENT",
    entity: "Student",
    entityId: String(id),
    details: { rollNo: student.rollNo },
    req,
  });

  res.json({ message: "Student record deleted successfully" });
};