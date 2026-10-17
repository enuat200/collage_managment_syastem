import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";

export const authenticate = async (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authenticated. Token missing or invalid." });
  }

  try {
    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "default_jwt_secret_fallback");

    // Verify user exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        student: { select: { id: true, rollNo: true, departmentId: true, programId: true } },
        teacher: { select: { id: true, employeeId: true, departmentId: true } },
        staff: { select: { id: true, employeeId: true, roleTitle: true } },
      },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ message: "User account does not exist or is deactivated." });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};

export const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  // SUPER_ADMIN has access to everything
  if (req.user.role === "SUPER_ADMIN") {
    return next();
  }

  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      message: `Access denied. Requires one of roles: [${roles.join(", ")}], but your role is ${req.user.role}`,
    });
  }

  next();
};