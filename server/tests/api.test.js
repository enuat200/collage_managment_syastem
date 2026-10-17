import test from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../src/config/prisma.js";
import { calculateGrade } from "../src/controllers/examController.js";

test("🔐 Authentication: password hashing and verification", async () => {
  const password = "Admin@123";
  const hash = await bcrypt.hash(password, 10);
  const isValid = await bcrypt.compare(password, hash);
  const isInvalid = await bcrypt.compare("WrongPassword", hash);

  assert.equal(isValid, true, "Valid password must match hash");
  assert.equal(isInvalid, false, "Invalid password must not match hash");
});

test("🔑 Security: JWT token generation and role payload", () => {
  const secret = process.env.JWT_SECRET || "default_jwt_secret_fallback";
  const token = jwt.sign({ id: 1, role: "SUPER_ADMIN" }, secret, { expiresIn: "1h" });
  const decoded = jwt.verify(token, secret);

  assert.equal(decoded.id, 1);
  assert.equal(decoded.role, "SUPER_ADMIN");
});

test("📊 Grade Scale: automatic letter grade and GPA computation", async () => {
  const gradeA = await calculateGrade(95, 100);
  assert.equal(gradeA.letterGrade, "A+");
  assert.equal(gradeA.gradePoint, 4.0);

  const gradeB = await calculateGrade(78, 100);
  assert.equal(gradeB.letterGrade, "B+");
  assert.equal(gradeB.gradePoint, 3.25);

  const gradeF = await calculateGrade(40, 100);
  assert.equal(gradeF.letterGrade, "F");
  assert.equal(gradeF.gradePoint, 0.0);
});

test("🎓 Database: verify all 7 roles exist in seeded database", async () => {
  const roles = [
    "SUPER_ADMIN",
    "COLLEGE_ADMIN",
    "REGISTRAR",
    "TEACHER",
    "STUDENT",
    "ACCOUNTANT",
    "LIBRARIAN",
  ];

  for (const role of roles) {
    const user = await prisma.user.findFirst({ where: { role } });
    assert.ok(user, `User with role ${role} must exist in seeded database`);
  }
});

test("💰 Financial Transactions: invoice and payment balance consistency", async () => {
  const invoice = await prisma.invoice.findFirst({
    where: { invoiceNumber: "INV-2026-0001" },
    include: { payments: true },
  });

  assert.ok(invoice, "Invoice INV-2026-0001 must exist");
  assert.equal(invoice.totalAmount, 3700);
  assert.equal(invoice.paidAmount, 2000);
  assert.equal(invoice.balance, 1700);
  assert.equal(invoice.status, "PARTIALLY_PAID");

  const totalPayments = invoice.payments.reduce((acc, p) => acc + p.amount, 0);
  assert.equal(totalPayments, invoice.paidAmount, "Total recorded payments must equal paidAmount");
});

test("📚 Library Management: copy availability tracking", async () => {
  const book = await prisma.book.findFirst({
    where: { isbn: "978-0132350884" },
    include: { copies: true },
  });

  assert.ok(book, "Clean Code book must exist");
  assert.equal(book.totalCopies, 5);
  assert.equal(book.availableCopies, 4);

  const borrowedCopies = book.copies.filter((c) => c.status === "BORROWED");
  assert.equal(borrowedCopies.length, 1, "Exactly one copy should be marked as borrowed");
});

test("⚠️ Timetable Conflict Detection: duplicate room booking prevention logic", async () => {
  const existing = await prisma.timetable.findFirst({
    where: { day: "Monday", room: "Hall 101" },
  });

  assert.ok(existing, "Existing Monday Hall 101 slot must exist");

  // Conflict query simulating createTimetable
  const conflictingSlot = await prisma.timetable.findFirst({
    where: {
      day: "Monday",
      room: "Hall 101",
      OR: [
        { AND: [{ startTime: { lte: "09:30" } }, { endTime: { gt: "09:30" } }] },
        { AND: [{ startTime: { lt: "10:00" } }, { endTime: { gte: "10:00" } }] },
      ],
    },
  });

  assert.ok(conflictingSlot, "Conflict detection query must flag overlapping time slot");
});
