import bcrypt from "bcryptjs";
import prisma from "../config/prisma.js";
import { createAuditLog } from "../middleware/audit.js";

const staffSelect = {
  id: true,
  employeeId: true,
  roleTitle: true,
  joiningDate: true,
  createdAt: true,
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      avatarUrl: true,
      isActive: true,
    },
  },
  department: { select: { id: true, name: true, code: true } },
};

export const listStaff = async (req, res) => {
  const { role, departmentId, search } = req.query;
  const where = {};

  if (departmentId) where.departmentId = Number(departmentId);
  if (role) where.user = { role };
  if (search) {
    where.OR = [
      { employeeId: { contains: search, mode: "insensitive" } },
      { roleTitle: { contains: search, mode: "insensitive" } },
      { user: { name: { contains: search, mode: "insensitive" } } },
      { user: { email: { contains: search, mode: "insensitive" } } },
    ];
  }

  const staff = await prisma.staff.findMany({
    where,
    select: staffSelect,
    orderBy: { user: { name: "asc" } },
  });

  res.json(staff);
};

export const createStaff = async (req, res) => {
  const {
    name,
    email,
    password = "Staff@123",
    role = "REGISTRAR", // REGISTRAR, ACCOUNTANT, LIBRARIAN, etc.
    roleTitle,
    employeeId,
    departmentId,
    phone,
  } = req.body;

  const existingEmail = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existingEmail) {
    return res.status(409).json({ message: "A user with this email address already exists" });
  }

  let empId = employeeId;
  if (!empId) {
    const prefix = role.slice(0, 3).toUpperCase();
    const count = await prisma.staff.count();
    empId = `${prefix}-${String(count + 1).padStart(3, "0")}`;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const staff = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
        role,
        phone,
      },
    });

    return tx.staff.create({
      data: {
        userId: user.id,
        employeeId: empId,
        roleTitle: roleTitle || `${role.replace("_", " ")} Officer`,
        departmentId: departmentId ? Number(departmentId) : null,
      },
      select: staffSelect,
    });
  });

  await createAuditLog({
    userId: req.user.id,
    action: "CREATE_STAFF",
    entity: "Staff",
    entityId: String(staff.id),
    details: { employeeId: staff.employeeId, name, role },
    req,
  });

  res.status(201).json(staff);
};

export const updateStaff = async (req, res) => {
  const id = Number(req.params.id);
  const { name, email, password, phone, roleTitle, departmentId, role } = req.body;

  const existing = await prisma.staff.findUnique({ where: { id }, select: { userId: true } });
  if (!existing) return res.status(404).json({ message: "Staff record not found" });

  const userData = {};
  if (name) userData.name = name;
  if (email) userData.email = email.toLowerCase();
  if (phone !== undefined) userData.phone = phone;
  if (role) userData.role = role;
  if (password) userData.passwordHash = await bcrypt.hash(password, 10);

  const staff = await prisma.$transaction(async (tx) => {
    if (Object.keys(userData).length) {
      await tx.user.update({
        where: { id: existing.userId },
        data: userData,
      });
    }

    return tx.staff.update({
      where: { id },
      data: {
        roleTitle: roleTitle || undefined,
        departmentId: departmentId !== undefined ? (departmentId ? Number(departmentId) : null) : undefined,
      },
      select: staffSelect,
    });
  });

  res.json(staff);
};

export const deleteStaff = async (req, res) => {
  const id = Number(req.params.id);
  const staff = await prisma.staff.findUnique({ where: { id }, select: { userId: true } });
  if (!staff) return res.status(404).json({ message: "Staff not found" });

  await prisma.user.delete({ where: { id: staff.userId } });
  res.json({ message: "Staff record deleted successfully" });
};
