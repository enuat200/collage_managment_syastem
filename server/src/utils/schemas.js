import { z } from "zod";

export const departmentSchema = z.object({
  name: z.string().trim().min(2),
});

const courseBase = z.object({
  code: z.string().trim().min(2),
  title: z.string().trim().min(2),
  credits: z.number().int().min(1).max(10).optional(),
  departmentId: z.number().int().positive(),
  teacherId: z.number().int().positive().nullable().optional(),
});
export const courseSchema = courseBase;
export const courseUpdateSchema = courseBase.partial();

const studentBase = z.object({
  name: z.string().trim().min(2),
  email: z.email(),
  password: z.string().min(8),
  rollNo: z.string().trim().min(1),
  departmentId: z.number().int().positive(),
  semester: z.number().int().min(1).max(12).optional(),
});
export const studentSchema = studentBase;
export const studentUpdateSchema = studentBase.partial();

const teacherBase = z.object({
  name: z.string().trim().min(2),
  email: z.email(),
  password: z.string().min(8),
  departmentId: z.number().int().positive(),
});
export const teacherSchema = teacherBase;
export const teacherUpdateSchema = teacherBase.partial();