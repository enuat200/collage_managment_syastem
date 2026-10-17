import prisma from "../config/prisma.js";

// ==================== ANNOUNCEMENTS ====================
export const listAnnouncements = async (req, res) => {
  const role = req.user.role;
  const where = {};

  if (role === "STUDENT") {
    where.OR = [{ audience: "ALL" }, { audience: "STUDENTS" }];
  } else if (role === "TEACHER") {
    where.OR = [{ audience: "ALL" }, { audience: "TEACHERS" }];
  } else if (role === "ACCOUNTANT" || role === "LIBRARIAN" || role === "REGISTRAR") {
    where.OR = [{ audience: "ALL" }, { audience: "STAFF" }];
  }

  const announcements = await prisma.announcement.findMany({
    where,
    include: {
      author: { select: { id: true, name: true, role: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  res.json(announcements);
};

export const createAnnouncement = async (req, res) => {
  const { title, body, audience = "ALL", priority = "NORMAL", expiresAt } = req.body;

  const announcement = await prisma.announcement.create({
    data: {
      authorId: req.user.id,
      title,
      body,
      audience,
      priority,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
    include: { author: { select: { name: true, role: true } } },
  });

  res.status(201).json(announcement);
};

export const deleteAnnouncement = async (req, res) => {
  await prisma.announcement.delete({ where: { id: Number(req.params.id) } });
  res.json({ message: "Announcement deleted" });
};

// ==================== NOTIFICATIONS ====================
export const listNotifications = async (req, res) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  res.json(notifications);
};

export const markNotificationRead = async (req, res) => {
  const notification = await prisma.notification.update({
    where: { id: Number(req.params.id) },
    data: { isRead: true },
  });
  res.json(notification);
};

export const markAllNotificationsRead = async (req, res) => {
  await prisma.notification.updateMany({
    where: { userId: req.user.id, isRead: false },
    data: { isRead: true },
  });
  res.json({ message: "All notifications marked as read" });
};
