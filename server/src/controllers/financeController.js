import prisma from "../config/prisma.js";
import { createAuditLog } from "../middleware/audit.js";

// ==================== FEE STRUCTURES ====================
export const listFeeStructures = async (req, res) => {
  const { programId, semesterId } = req.query;
  const where = {};
  if (programId) where.programId = Number(programId);
  if (semesterId) where.semesterId = Number(semesterId);

  const structures = await prisma.feeStructure.findMany({
    where,
    include: {
      program: { select: { id: true, name: true, code: true } },
      semester: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  res.json(structures);
};

export const createFeeStructure = async (req, res) => {
  const { name, programId, semesterId, feeType = "TUITION", amount, dueDate, description } = req.body;
  const structure = await prisma.feeStructure.create({
    data: {
      name,
      programId: programId ? Number(programId) : null,
      semesterId: semesterId ? Number(semesterId) : null,
      feeType,
      amount: Number(amount),
      dueDate: dueDate ? new Date(dueDate) : null,
      description,
    },
    include: { program: true, semester: true },
  });
  res.status(201).json(structure);
};

// ==================== INVOICES ====================
export const listInvoices = async (req, res) => {
  const { studentId, status, search } = req.query;
  const where = {};

  if (studentId) where.studentId = Number(studentId);
  if (status) where.status = status;

  if (req.user.role === "STUDENT") {
    where.studentId = req.user.student?.id;
  }

  if (search) {
    where.OR = [
      { invoiceNumber: { contains: search, mode: "insensitive" } },
      { student: { user: { name: { contains: search, mode: "insensitive" } } } },
      { student: { rollNo: { contains: search, mode: "insensitive" } } },
    ];
  }

  const invoices = await prisma.invoice.findMany({
    where,
    include: {
      student: {
        include: {
          user: { select: { name: true, email: true } },
          department: { select: { name: true, code: true } },
        },
      },
      semester: true,
      feeItems: true,
      payments: true,
    },
    orderBy: { issueDate: "desc" },
  });

  res.json(invoices);
};

export const getInvoice = async (req, res) => {
  const invoiceId = Number(req.params.id);

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      student: {
        include: {
          user: { select: { name: true, email: true, phone: true } },
          department: true,
          program: true,
        },
      },
      semester: true,
      feeItems: true,
      payments: {
        include: {
          recordedBy: { select: { name: true } },
        },
      },
    },
  });

  if (!invoice) return res.status(404).json({ message: "Invoice not found" });

  if (req.user.role === "STUDENT" && req.user.student?.id !== invoice.studentId) {
    return res.status(403).json({ message: "Access denied to invoice" });
  }

  res.json(invoice);
};

export const createInvoice = async (req, res) => {
  const { studentId, semesterId, dueDate, items, notes } = req.body;

  const year = new Date().getFullYear();
  const count = await prisma.invoice.count();
  const invoiceNumber = `INV-${year}-${String(count + 1).padStart(4, "0")}`;

  const feeItemsList = Array.isArray(items) && items.length > 0 ? items : [{ title: "Tuition Fee", amount: 1000 }];
  const totalAmount = feeItemsList.reduce((acc, item) => acc + Number(item.amount), 0);

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      studentId: Number(studentId),
      semesterId: semesterId ? Number(semesterId) : null,
      dueDate: new Date(dueDate || Date.now() + 30 * 24 * 60 * 60 * 1000),
      totalAmount,
      paidAmount: 0,
      balance: totalAmount,
      status: "UNPAID",
      notes,
      feeItems: {
        create: feeItemsList.map((item) => ({
          title: item.title,
          amount: Number(item.amount),
        })),
      },
    },
    include: {
      student: { include: { user: { select: { name: true } } } },
      feeItems: true,
    },
  });

  await createAuditLog({
    userId: req.user.id,
    action: "GENERATE_INVOICE",
    entity: "Invoice",
    entityId: String(invoice.id),
    details: { invoiceNumber, totalAmount, studentId },
    req,
  });

  res.status(201).json(invoice);
};

// ==================== PAYMENTS (ACID TRANSACTION) ====================
export const recordPayment = async (req, res) => {
  const { invoiceId, amount, paymentMethod = "BANK_TRANSFER", transactionRef, notes } = req.body;
  const payAmount = Number(amount);

  if (payAmount <= 0) {
    return res.status(400).json({ message: "Payment amount must be greater than zero." });
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: Number(invoiceId) },
  });

  if (!invoice) return res.status(404).json({ message: "Invoice not found" });

  if (invoice.status === "PAID") {
    return res.status(400).json({ message: "This invoice is already fully paid." });
  }

  if (payAmount > invoice.balance + 0.001) {
    return res.status(400).json({
      message: `Payment amount ($${payAmount.toFixed(2)}) cannot exceed outstanding balance ($${invoice.balance.toFixed(2)}).`,
    });
  }

  const year = new Date().getFullYear();
  const paymentCount = await prisma.payment.count();
  const paymentNumber = `PAY-${year}-${String(paymentCount + 1).padStart(4, "0")}`;

  // Execute in isolated database transaction
  const result = await prisma.$transaction(async (tx) => {
    const newPaidAmount = invoice.paidAmount + payAmount;
    const newBalance = Math.max(0, invoice.totalAmount - newPaidAmount);
    const newStatus = newBalance <= 0.01 ? "PAID" : "PARTIALLY_PAID";

    const payment = await tx.payment.create({
      data: {
        paymentNumber,
        invoiceId: invoice.id,
        amount: payAmount,
        paymentMethod,
        transactionRef,
        notes,
        recordedById: req.user.id,
        status: "COMPLETED",
      },
    });

    const updatedInvoice = await tx.invoice.update({
      where: { id: invoice.id },
      data: {
        paidAmount: newPaidAmount,
        balance: newBalance,
        status: newStatus,
      },
      include: {
        student: { include: { user: { select: { name: true, email: true } } } },
        feeItems: true,
        payments: true,
      },
    });

    return { payment, updatedInvoice };
  });

  await createAuditLog({
    userId: req.user.id,
    action: "RECORD_PAYMENT",
    entity: "Payment",
    entityId: String(result.payment.id),
    details: { paymentNumber, amount: payAmount, invoiceNumber: invoice.invoiceNumber },
    req,
  });

  res.status(201).json(result);
};

export const listPayments = async (req, res) => {
  const payments = await prisma.payment.findMany({
    include: {
      invoice: {
        include: {
          student: { include: { user: { select: { name: true, email: true } } } },
        },
      },
      recordedBy: { select: { name: true } },
    },
    orderBy: { paymentDate: "desc" },
  });
  res.json(payments);
};

export const getFinancialSummary = async (req, res) => {
  const [totals, methodBreakdown] = await Promise.all([
    prisma.invoice.aggregate({
      _sum: { totalAmount: true, paidAmount: true, balance: true },
      _count: { id: true },
    }),
    prisma.payment.groupBy({
      by: ["paymentMethod"],
      _sum: { amount: true },
      _count: { id: true },
    }),
  ]);

  res.json({
    totalBilled: totals._sum.totalAmount || 0,
    totalCollected: totals._sum.paidAmount || 0,
    outstandingReceivables: totals._sum.balance || 0,
    totalInvoices: totals._count.id,
    methods: methodBreakdown.map((m) => ({
      method: m.paymentMethod,
      amount: m._sum.amount,
      count: m._count.id,
    })),
  });
};
