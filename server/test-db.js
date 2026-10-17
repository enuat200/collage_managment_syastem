import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

try {
  const start = Date.now();
  const result = await prisma.$queryRaw`SELECT 1 as ok`;
  console.log("Connected!", result, `${Date.now() - start} ms`);
} catch (e) {
  console.error("Failed:", e.message);
} finally {
  await prisma.$disconnect();
}