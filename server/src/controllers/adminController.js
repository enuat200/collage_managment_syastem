import prisma from "../config/prisma.js";
import { createAuditLog } from "../middleware/audit.js";

export const listUsers = async (req, res) => {
  const { role, search } = req.query;
  const where = {};

  if (role) where.role = role;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  res.json(users);
};

export const updateUserStatus = async (req, res) => {
  const userId = Number(req.params.id);
  const { isActive, role } = req.body;

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      isActive: isActive !== undefined ? Boolean(isActive) : undefined,
      role: role || undefined,
    },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });

  await createAuditLog({
    userId: req.user.id,
    action: "UPDATE_USER_STATUS",
    entity: "User",
    entityId: String(userId),
    details: { isActive, role },
    req,
  });

  res.json(updated);
};

export const listAuditLogs = async (req, res) => {
  const { action, entity, search, limit = 50 } = req.query;
  const where = {};

  if (action) where.action = action;
  if (entity) where.entity = entity;
  if (search) {
    where.OR = [
      { action: { contains: search, mode: "insensitive" } },
      { entity: { contains: search, mode: "insensitive" } },
      { details: { contains: search, mode: "insensitive" } },
    ];
  }

  const logs = await prisma.auditLog.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
    },
    orderBy: { createdAt: "desc" },
    take: Math.min(Number(limit), 100),
  });

  res.json(logs);
};

export const listGradeScales = async (req, res) => {
  const scales = await prisma.gradeScale.findMany({
    orderBy: { minScore: "desc" },
  });
  res.json(scales);
};

export const updateGradeScale = async (req, res) => {
  const { id } = req.params;
  const { letterGrade, minScore, maxScore, gpaPoint, description, isPassing } = req.body;

  const scale = await prisma.gradeScale.update({
    where: { id: Number(id) },
    data: {
      letterGrade,
      minScore: Number(minScore),
      maxScore: Number(maxScore),
      gpaPoint: Number(gpaPoint),
      description,
      isPassing: Boolean(isPassing),
    },
  });

  res.json(scale);
};
