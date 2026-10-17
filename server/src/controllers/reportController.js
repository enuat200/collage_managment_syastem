import prisma from "../config/prisma.js";

export const getEnrollmentReport = async (req, res) => {
  const [totalStudents, byDepartment, byProgram, byStatus, byGender] = await Promise.all([
    prisma.student.count(),
    prisma.department.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        _count: { select: { students: true } },
      },
    }),
    prisma.program.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        _count: { select: { students: true } },
      },
    }),
    prisma.student.groupBy({
      by: ["enrollmentStatus"],
      _count: { id: true },
    }),
    prisma.student.groupBy({
      by: ["gender"],
      _count: { id: true },
    }),
  ]);

  res.json({
    totalStudents,
    byDepartment: byDepartment.map((d) => ({ name: d.name, code: d.code, count: d._count.students })),
    byProgram: byProgram.map((p) => ({ name: p.name, code: p.code, count: p._count.students })),
    byStatus: byStatus.map((s) => ({ status: s.enrollmentStatus, count: s._count.id })),
    byGender: byGender.map((g) => ({ gender: g.gender || "Unspecified", count: g._count.id })),
  });
};

export const getAttendanceReport = async (req, res) => {
  const sessions = await prisma.attendanceSession.findMany({
    include: {
      course: { select: { code: true, title: true } },
      records: true,
    },
  });

  const courseStats = {};
  for (const s of sessions) {
    const code = s.course.code;
    if (!courseStats[code]) {
      courseStats[code] = {
        code,
        title: s.course.title,
        totalSessions: 0,
        totalRecords: 0,
        present: 0,
        late: 0,
        absent: 0,
        excused: 0,
      };
    }

    courseStats[code].totalSessions += 1;
    courseStats[code].totalRecords += s.records.length;
    for (const r of s.records) {
      if (r.status === "PRESENT") courseStats[code].present += 1;
      else if (r.status === "LATE") courseStats[code].late += 1;
      else if (r.status === "ABSENT") courseStats[code].absent += 1;
      else if (r.status === "EXCUSED") courseStats[code].excused += 1;
    }
  }

  const result = Object.values(courseStats).map((c) => {
    const effectivePresent = c.present + c.excused + c.late * 0.5;
    const rate = c.totalRecords > 0 ? ((effectivePresent / c.totalRecords) * 100).toFixed(1) : "100.0";
    return {
      ...c,
      attendanceRate: Number(rate),
    };
  });

  res.json(result);
};

export const getAcademicReport = async (req, res) => {
  const [totalExams, totalMarks, marks] = await Promise.all([
    prisma.exam.count(),
    prisma.mark.count({ where: { isPublished: true } }),
    prisma.mark.findMany({
      where: { isPublished: true },
      include: {
        exam: { select: { title: true, courseId: true } },
        student: { include: { user: { select: { name: true } } } },
      },
    }),
  ]);

  const gradeDistribution = {};
  for (const m of marks) {
    const grade = m.letterGrade || "Ungraded";
    gradeDistribution[grade] = (gradeDistribution[grade] || 0) + 1;
  }

  const avgScore =
    marks.length > 0 ? (marks.reduce((acc, m) => acc + m.score, 0) / marks.length).toFixed(1) : "0.0";

  res.json({
    totalExams,
    totalMarksRecorded: totalMarks,
    averageScore: Number(avgScore),
    gradeDistribution: Object.entries(gradeDistribution).map(([grade, count]) => ({
      grade,
      count,
    })),
  });
};

export const getFinancialReport = async (req, res) => {
  const [invoicesAgg, invoicesByStatus, recentPayments] = await Promise.all([
    prisma.invoice.aggregate({
      _sum: { totalAmount: true, paidAmount: true, balance: true },
      _count: { id: true },
    }),
    prisma.invoice.groupBy({
      by: ["status"],
      _sum: { totalAmount: true, paidAmount: true, balance: true },
      _count: { id: true },
    }),
    prisma.payment.findMany({
      take: 20,
      orderBy: { paymentDate: "desc" },
      include: {
        invoice: {
          include: { student: { include: { user: { select: { name: true } } } } },
        },
      },
    }),
  ]);

  res.json({
    summary: {
      totalInvoiced: invoicesAgg._sum.totalAmount || 0,
      totalCollected: invoicesAgg._sum.paidAmount || 0,
      totalOutstanding: invoicesAgg._sum.balance || 0,
      invoiceCount: invoicesAgg._count.id,
    },
    byStatus: invoicesByStatus.map((s) => ({
      status: s.status,
      count: s._count.id,
      amount: s._sum.totalAmount,
      balance: s._sum.balance,
    })),
    recentPayments,
  });
};

export const getLibraryReport = async (req, res) => {
  const [totalBooks, totalCopies, availableCopies, totalLoans, overdueLoans, topBooks] =
    await Promise.all([
      prisma.book.count(),
      prisma.bookCopy.count(),
      prisma.bookCopy.count({ where: { status: "AVAILABLE" } }),
      prisma.bookLoan.count(),
      prisma.bookLoan.count({ where: { status: "OVERDUE" } }),
      prisma.book.findMany({
        take: 5,
        orderBy: { loans: { _count: "desc" } },
        include: { _count: { select: { loans: true } } },
      }),
    ]);

  res.json({
    totalBooks,
    totalCopies,
    availableCopies,
    borrowedCopies: totalCopies - availableCopies,
    totalLoans,
    overdueLoans,
    topBorrowedBooks: topBooks.map((b) => ({
      title: b.title,
      author: b.author,
      borrowCount: b._count.loans,
    })),
  });
};
