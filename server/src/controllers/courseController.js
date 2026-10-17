import prisma from "../config/prisma.js";

const courseInclude = {
  department: { select: { id: true, name: true } },
  teacher: { select: { id: true, user: { select: { name: true } } } },
};

export const listCourses = async (req, res) => {
  const courses = await prisma.course.findMany({
    include: courseInclude,
    orderBy: { code: "asc" },
  });
  res.json(courses);
};

export const createCourse = async (req, res) => {
  const course = await prisma.course.create({
    data: req.body,
    include: courseInclude,
  });
  res.status(201).json(course);
};

export const updateCourse = async (req, res) => {
  const course = await prisma.course.update({
    where: { id: Number(req.params.id) },
    data: req.body,
    include: courseInclude,
  });
  res.json(course);
};

export const deleteCourse = async (req, res) => {
  await prisma.course.delete({ where: { id: Number(req.params.id) } });
  res.json({ message: "Course deleted" });
};