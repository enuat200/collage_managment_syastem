import prisma from "../config/prisma.js";

export const createAuditLog = async ({ userId, action, entity, entityId, details, req }) => {
  try {
    const ipAddress = req?.headers["x-forwarded-for"] || req?.socket?.remoteAddress || "127.0.0.1";
    await prisma.auditLog.create({
      data: {
        userId: userId ? Number(userId) : null,
        action,
        entity,
        entityId: entityId ? String(entityId) : null,
        details: typeof details === "object" ? JSON.stringify(details) : details,
        ipAddress: String(ipAddress),
      },
    });
  } catch (err) {
    console.error("Audit log error:", err.message);
  }
};
