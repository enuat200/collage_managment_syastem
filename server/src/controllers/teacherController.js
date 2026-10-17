import bcrypt from "bcryptjs";
import prisma from "../config/prisma.js";
import { createAuditLog } from "../middleware/audit.js";

const teacherSelect = {
  id: true,
  employeeId: true,
  designation: true,
  qualification: true,
  specialization: true,
  joiningDate: true,
  officeRoom: true,
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
  assignments: {
    include: {
      course: true,
      section: true,
    },
  },
};

export const listTeachers = async (req, res) => {
  const { departmentId, search } = req.query;
  const where = {};

  if (departmentId) where.departmentId = Number(departmentId);
  if (search) {
    where.OR = [
      { employeeId: { contains: search, mode: "insensitive" } },
      { user: { name: { contains: search, mode: "insensitive" } } },
      { user: { email: { contains: search, mode: "insensitive" } } },
      { specialization: { contains: search, mode: "insensitive" } },
    ];
  }

  const teachers = await prisma.teacher.findMany({
    where,
    select: teacherSelect,
    orderBy: { user: { name: "asc" } },
  });

  res.json(teachers);
};

export const getTeacher = async (req, res) => {
  const teacher = await prisma.teacher.findUnique({
    where: { id: Number(req.params.id) },
    select: {
      ...teacherSelect,
      attendanceSessions: {
        take: 10,
        orderBy: { date: "desc" },
        include: { course: true },
      },
    },
  });

  if (!teacher) return res.status(404).json({ message: "Teacher not found" });
  res.json(teacher);
};

export const createTeacher = async (req, res) => {
  const {
    name,
    email,
    password = "Teacher@123",
    employeeId,
    departmentId,
    designation = "Assistant Professor",
    qualification,
    specialization,
    phone,
    officeRoom,
  } = req.body;

  const existingEmail = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existingEmail) {
    return res.status(409).json({ message: "A user with this email address already exists" });
  }

  let empId = employeeId;
  if (!empId) {
    const count = await prisma.teacher.count();
    empId = `FAC-${String(count + 1).padStart(3, "0")}`;
  }

  const existingEmpId = await prisma.teacher.findUnique({ where: { employeeId: empId } });
  if (existingEmpId) {
    return res.status(409).json({ message: "A teacher with this Employee ID already exists" });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const teacher = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
        role: "TEACHER",
        phone,
      },
    });

    return tx.teacher.create({
      data: {
        userId: user.id,
        employeeId: empId,
        departmentId: Number(departmentId),
        designation,
        qualification,
        specialization,
        officeRoom,
      },
      select: teacherSelect,
    });
  });

  await createAuditLog({
    userId: req.user.id,
    action: "CREATE_TEACHER",
    entity: "Teacher",
    entityId: String(teacher.id),
    details: { employeeId: teacher.employeeId, name },
    req,
  });

  res.status(201).json(teacher);
};

export const updateTeacher = async (req, res) => {
  const id = Number(req.params.id);
  const {
    name,
    email,
    password,
    phone,
    employeeId,
    departmentId,
    designation,
    qualification,
    specialization,
    officeRoom,
  } = req.body;

  const existing = await prisma.teacher.findUnique({ where: { id }, select: { userId: true } });
  if (!existing) return res.status(404).json({ message: "Teacher not found" });

  const userData = {};
  if (name) userData.name = name;
  if (email) userData.email = email.toLowerCase();
  if (phone !== undefined) userData.phone = phone;
  if (password) userData.passwordHash = await bcrypt.hash(password, 10);

  const teacher = await prisma.$transaction(async (tx) => {
    if (Object.keys(userData).length) {
      await tx.user.update({
        where: { id: existing.userId },
        data: userData,
      });
    }

    return tx.teacher.update({
      where: { id },
      data: {
        employeeId: employeeId !== undefined ? employeeId : undefined,
        departmentId: departmentId ? Number(departmentId) : undefined,
        designation: designation !== undefined ? designation : undefined,
        qualification: qualification !== undefined ? qualification : undefined,
        specialization: specialization !== undefined ? specialization : undefined,
        officeRoom: officeRoom !== undefined ? officeRoom : undefined,
      },
      select: teacherSelect,
    });
  });

  await createAuditLog({
    userId: req.user.id,
    action: "UPDATE_TEACHER",
    entity: "Teacher",
    entityId: String(id),
    details: { employeeId: teacher.employeeId },
    req,
  });

  res.json(teacher);
};

export const deleteTeacher = async (req, res) => {
  const id = Number(req.params.id);
  const teacher = await prisma.teacher.findUnique({
    where: { id },
    select: { userId: true, employeeId: true },
  });
  if (!teacher) return res.status(404).json({ message: "Teacher not found" });

  await prisma.user.delete({ where: { id: teacher.userId } });

  await createAuditLog({
    userId: req.user.id,
    action: "DELETE_TEACHER",
    entity: "Teacher",
    entityId: String(id),
    details: { employeeId: teacher.employeeId },
    req,
  });

  res.json({ message: "Teacher deleted successfully" });
};