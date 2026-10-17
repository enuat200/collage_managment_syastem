import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import prisma from "../config/prisma.js";
import { createAuditLog } from "../middleware/audit.js";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const login = async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "A valid email and password are required" });
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: {
      student: { include: { department: true, program: true } },
      teacher: { include: { department: true } },
      staff: { include: { department: true } },
    },
  });

  if (!user || !user.isActive) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET || "default_jwt_secret_fallback",
    { expiresIn: "7d" }
  );

  await createAuditLog({
    userId: user.id,
    action: "USER_LOGIN",
    entity: "User",
    entityId: String(user.id),
    details: { email: user.email, role: user.role },
    req,
  });

  const { passwordHash, ...userWithoutPassword } = user;
  res.json({
    token,
    user: userWithoutPassword,
  });
};

export const me = async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: {
      student: { include: { department: true, program: true } },
      teacher: { include: { department: true } },
      staff: { include: { department: true } },
    },
  });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const { passwordHash, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
};

export const updateProfile = async (req, res) => {
  const { name, phone, avatarUrl } = req.body;

  const updated = await prisma.user.update({
    where: { id: req.user.id },
    data: {
      name: name || undefined,
      phone: phone !== undefined ? phone : undefined,
      avatarUrl: avatarUrl !== undefined ? avatarUrl : undefined,
    },
    include: {
      student: { include: { department: true, program: true } },
      teacher: { include: { department: true } },
      staff: { include: { department: true } },
    },
  });

  await createAuditLog({
    userId: req.user.id,
    action: "UPDATE_PROFILE",
    entity: "User",
    entityId: String(req.user.id),
    details: { name, phone },
    req,
  });

  const { passwordHash, ...userWithoutPassword } = updated;
  res.json(userWithoutPassword);
};

export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword || newPassword.length < 6) {
    return res.status(400).json({ message: "New password must be at least 6 characters." });
  }

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  const matches = await bcrypt.compare(currentPassword, user.passwordHash);

  if (!matches) {
    return res.status(400).json({ message: "Incorrect current password." });
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: req.user.id },
    data: { passwordHash },
  });

  await createAuditLog({
    userId: req.user.id,
    action: "PASSWORD_CHANGED",
    entity: "User",
    entityId: String(req.user.id),
    details: "User updated their own password",
    req,
  });

  res.json({ message: "Password updated successfully" });
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await prisma.user.findUnique({ where: { email: email?.toLowerCase() } });

  // Always return 200 to prevent user enumeration attacks
  if (!user) {
    return res.json({ message: "If that email exists in our system, password reset instructions have been generated." });
  }

  const resetToken = jwt.sign(
    { id: user.id, purpose: "reset_password" },
    process.env.JWT_SECRET || "default_jwt_secret_fallback",
    { expiresIn: "1h" }
  );

  res.json({
    message: "If that email exists in our system, password reset instructions have been generated.",
    devToken: resetToken, // Provided in development for seamless testing
  });
};

export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword || newPassword.length < 6) {
    return res.status(400).json({ message: "Valid reset token and password (min 6 chars) are required." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "default_jwt_secret_fallback");
    if (decoded.purpose !== "reset_password") {
      return res.status(400).json({ message: "Invalid token purpose." });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: decoded.id },
      data: { passwordHash },
    });

    res.json({ message: "Password has been reset successfully. You can now login with your new password." });
  } catch (err) {
    return res.status(400).json({ message: "Reset token has expired or is invalid." });
  }
};