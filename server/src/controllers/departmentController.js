import prisma from "../config/prisma.js";

export const listDepartments = async (req, res) => {
  const departments = await prisma.department.findMany({ orderBy: { name: "asc" } });
  res.json(departments);
};

export const createDepartment = async (req, res) => {
  const department = await prisma.department.create({ data: { name: req.body.name } });
  res.status(201).json(department);
};

export const updateDepartment = async (req, res) => {
  const department = await prisma.department.update({
    where: { id: Number(req.params.id) },
    data: { name: req.body.name },
  });
  res.json(department);
};

export const deleteDepartment = async (req, res) => {
  await prisma.department.delete({ where: { id: Number(req.params.id) } });
  res.json({ message: "Department deleted" });
};