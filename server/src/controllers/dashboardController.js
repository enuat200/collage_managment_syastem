import prisma from "../config/prisma.js";

export const getDashboardStats = async (req, res) => {
  const role = req.user.role;
  const userId = req.user.id;

  try {
    // 1. Fetch common announcements targeted to this role or ALL
    const announcements = await prisma.announcement.findMany({
      where: {
        OR: [
          { audience: "ALL" },
          { audience: role === "STUDENT" ? "STUDENTS" : role === "TEACHER" ? "TEACHERS" : "ADMINS" },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { author: { select: { name: true, role: true } } },
    });

    // 2. Fetch unread notifications for this user
    const notifications = await prisma.notification.findMany({
      where: { userId, isRead: false },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    let roleData = {};

    if (role === "SUPER_ADMIN" || role === "COLLEGE_ADMIN") {
      const [
        totalStudents,
        totalTeachers,
        totalStaff,
        totalDepartments,
        totalPrograms,
        totalCourses,
        invoicesSummary,
        recentAudits,
        recentStudents,
      ] = await Promise.all([
        prisma.student.count({ where: { enrollmentStatus: "ACTIVE" } }),
        prisma.teacher.count(),
        prisma.staff.count(),
        prisma.department.count(),
        prisma.program.count(),
        prisma.course.count(),
        prisma.invoice.aggregate({
          _sum: { totalAmount: true, paidAmount: true, balance: true },
        }),
        prisma.auditLog.findMany({
          orderBy: { createdAt: "desc" },
          take: 6,
          include: { user: { select: { name: true, email: true, role: true } } },
        }),
        prisma.student.findMany({
          orderBy: { createdAt: "desc" },
          take: 5,
          include: {
            user: { select: { name: true, email: true } },
            department: { select: { name: true, code: true } },
            program: { select: { name: true } },
          },
        }),
      ]);

      // Department enrollment breakdown for charts
      const departments = await prisma.department.findMany({
        select: {
          name: true,
          code: true,
          _count: { select: { students: true, teachers: true, courses: true } },
        },
      });

      roleData = {
        metrics: {
          totalStudents,
          totalTeachers,
          totalStaff,
          totalDepartments,
          totalPrograms,
          totalCourses,
          totalInvoiced: invoicesSummary._sum.totalAmount || 0,
          totalCollected: invoicesSummary._sum.paidAmount || 0,
          outstandingBalance: invoicesSummary._sum.balance || 0,
        },
        departmentStats: departments.map((d) => ({
          name: d.code,
          fullName: d.name,
          students: d._count.students,
          teachers: d._count.teachers,
          courses: d._count.courses,
        })),
        recentAudits,
        recentStudents,
      };
    } else if (role === "REGISTRAR") {
      const [totalStudents, activeStudents, graduatedStudents, totalPrograms, recentAdmissions] =
        await Promise.all([
          prisma.student.count(),
          prisma.student.count({ where: { enrollmentStatus: "ACTIVE" } }),
          prisma.student.count({ where: { enrollmentStatus: "GRADUATED" } }),
          prisma.program.count(),
          prisma.student.findMany({
            orderBy: { admissionDate: "desc" },
            take: 6,
            include: {
              user: { select: { name: true, email: true } },
              department: { select: { name: true, code: true } },
              program: { select: { name: true } },
            },
          }),
        ]);

      const programs = await prisma.program.findMany({
        select: {
          name: true,
          code: true,
          _count: { select: { students: true } },
        },
      });

      roleData = {
        metrics: {
          totalStudents,
          activeStudents,
          graduatedStudents,
          totalPrograms,
        },
        programStats: programs.map((p) => ({
          name: p.code,
          students: p._count.students,
        })),
        recentAdmissions,
      };
    } else if (role === "TEACHER") {
      const teacher = await prisma.teacher.findUnique({
        where: { userId },
        include: {
          assignments: {
            include: {
              course: true,
              section: true,
            },
          },
        },
      });

      if (teacher) {
        const assignedCourseIds = teacher.assignments.map((a) => a.courseId);
        const totalEnrolledStudents = await prisma.enrollment.count({
          where: { courseId: { in: assignedCourseIds } },
        });

        const upcomingExams = await prisma.exam.findMany({
          where: { courseId: { in: assignedCourseIds } },
          orderBy: { examDate: "asc" },
          take: 5,
          include: { course: { select: { code: true, title: true } } },
        });

        const recentSessions = await prisma.attendanceSession.findMany({
          where: { teacherId: teacher.id },
          orderBy: { date: "desc" },
          take: 5,
          include: {
            course: { select: { code: true, title: true } },
            _count: { select: { records: true } },
          },
        });

        const timetables = await prisma.timetable.findMany({
          where: { courseId: { in: assignedCourseIds } },
          include: { course: { select: { code: true, title: true } }, section: true },
        });

        roleData = {
          teacherProfile: teacher,
          metrics: {
            assignedCourses: teacher.assignments.length,
            totalStudents: totalEnrolledStudents,
            upcomingExamsCount: upcomingExams.length,
            sessionsConducted: recentSessions.length,
          },
          upcomingExams,
          recentSessions,
          timetables,
        };
      }
    } else if (role === "STUDENT") {
      const student = await prisma.student.findUnique({
        where: { userId },
        include: {
          department: true,
          program: true,
          enrollments: {
            include: {
              course: true,
              section: true,
              marks: { where: { isPublished: true } },
            },
          },
        },
      });

      if (student) {
        const studentEnrollmentIds = student.enrollments.map((e) => e.id);
        const courseIds = student.enrollments.map((e) => e.courseId);

        const [attendanceRecords, invoices, upcomingExams, timetables] = await Promise.all([
          prisma.attendanceRecord.findMany({
            where: { studentId: student.id },
          }),
          prisma.invoice.findMany({
            where: { studentId: student.id },
            orderBy: { dueDate: "asc" },
            include: { payments: true },
          }),
          prisma.exam.findMany({
            where: { courseId: { in: courseIds }, isPublished: true },
            orderBy: { examDate: "asc" },
            take: 4,
            include: { course: { select: { code: true, title: true } } },
          }),
          prisma.timetable.findMany({
            where: { courseId: { in: courseIds } },
            include: { course: { select: { code: true, title: true } }, section: true },
          }),
        ]);

        const totalAttendance = attendanceRecords.length;
        const presentCount = attendanceRecords.filter((a) => a.status === "PRESENT" || a.status === "EXCUSED").length;
        const attendancePercentage = totalAttendance > 0 ? ((presentCount / totalAttendance) * 100).toFixed(1) : "100.0";

        const totalInvoiced = invoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
        const totalPaid = invoices.reduce((acc, inv) => acc + inv.paidAmount, 0);
        const totalBalance = invoices.reduce((acc, inv) => acc + inv.balance, 0);

        roleData = {
          studentProfile: student,
          metrics: {
            enrolledCourses: student.enrollments.length,
            attendancePercentage: Number(attendancePercentage),
            totalBalance,
            totalPaid,
          },
          enrollments: student.enrollments,
          invoices,
          upcomingExams,
          timetables,
        };
      }
    } else if (role === "ACCOUNTANT") {
      const [invoicesSummary, pendingInvoices, recentPayments] = await Promise.all([
        prisma.invoice.aggregate({
          _sum: { totalAmount: true, paidAmount: true, balance: true },
          _count: { id: true },
        }),
        prisma.invoice.findMany({
          where: { status: { in: ["UNPAID", "PARTIALLY_PAID", "OVERDUE"] } },
          orderBy: { dueDate: "asc" },
          take: 5,
          include: { student: { include: { user: { select: { name: true, email: true } } } } },
        }),
        prisma.payment.findMany({
          orderBy: { paymentDate: "desc" },
          take: 6,
          include: {
            invoice: {
              include: { student: { include: { user: { select: { name: true } } } } },
            },
          },
        }),
      ]);

      const collectionRate =
        invoicesSummary._sum.totalAmount && invoicesSummary._sum.totalAmount > 0
          ? ((invoicesSummary._sum.paidAmount / invoicesSummary._sum.totalAmount) * 100).toFixed(1)
          : "0.0";

      roleData = {
        metrics: {
          totalInvoiced: invoicesSummary._sum.totalAmount || 0,
          totalCollected: invoicesSummary._sum.paidAmount || 0,
          outstandingBalance: invoicesSummary._sum.balance || 0,
          collectionRate: Number(collectionRate),
          invoiceCount: invoicesSummary._count.id,
        },
        pendingInvoices,
        recentPayments,
      };
    } else if (role === "LIBRARIAN") {
      const [totalBooks, totalCopies, activeLoans, overdueLoans, recentLoans] = await Promise.all([
        prisma.book.count(),
        prisma.bookCopy.count(),
        prisma.bookLoan.count({ where: { status: "BORROWED" } }),
        prisma.bookLoan.count({ where: { status: "OVERDUE" } }),
        prisma.bookLoan.findMany({
          orderBy: { borrowDate: "desc" },
          take: 6,
          include: {
            book: { select: { title: true, isbn: true, author: true } },
            user: { select: { name: true, email: true, role: true } },
          },
        }),
      ]);

      roleData = {
        metrics: {
          totalBooks,
          totalCopies,
          activeLoans,
          overdueLoans,
        },
        recentLoans,
      };
    }

    res.json({
      role,
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
      },
      announcements,
      notifications,
      ...roleData,
    });
  } catch (err) {
    console.error("Dashboard stats error:", err);
    res.status(500).json({ message: "Failed to load dashboard statistics", error: err.message });
  }
};
