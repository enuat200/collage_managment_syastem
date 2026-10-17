import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const rawUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
const directUrl = rawUrl.includes("?")
  ? `${rawUrl}&connect_timeout=60&pool_timeout=60`
  : `${rawUrl}?connect_timeout=60&pool_timeout=60`;

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: directUrl,
    },
  },
});

async function main() {
  console.log("🌱 Starting sequential database seed...");

  const passwordHash = await bcrypt.hash("Admin@123", 10);

  // Clean existing data in reverse order of foreign keys
  console.log("-> Cleaning any previous records...");
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.fine.deleteMany();
  await prisma.bookLoan.deleteMany();
  await prisma.bookCopy.deleteMany();
  await prisma.book.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.feeItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.feeStructure.deleteMany();
  await prisma.mark.deleteMany();
  await prisma.assessment.deleteMany();
  await prisma.exam.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.attendanceSession.deleteMany();
  await prisma.timetable.deleteMany();
  await prisma.courseAssignment.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.section.deleteMany();
  await prisma.course.deleteMany();
  await prisma.student.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.staff.deleteMany();
  await prisma.program.deleteMany();
  await prisma.department.deleteMany();
  await prisma.semester.deleteMany();
  await prisma.academicYear.deleteMany();
  await prisma.gradeScale.deleteMany();
  await prisma.user.deleteMany();

  console.log("-> Inserting Grade Scales...");
  await prisma.gradeScale.createMany({
    data: [
      { letterGrade: "A+", minScore: 90, maxScore: 100, gpaPoint: 4.0, description: "Outstanding", isPassing: true },
      { letterGrade: "A",  minScore: 85, maxScore: 89.99, gpaPoint: 3.75, description: "Excellent", isPassing: true },
      { letterGrade: "A-", minScore: 80, maxScore: 84.99, gpaPoint: 3.5, description: "Very Good", isPassing: true },
      { letterGrade: "B+", minScore: 75, maxScore: 79.99, gpaPoint: 3.25, description: "Good", isPassing: true },
      { letterGrade: "B",  minScore: 70, maxScore: 74.99, gpaPoint: 3.0, description: "Above Average", isPassing: true },
      { letterGrade: "B-", minScore: 65, maxScore: 69.99, gpaPoint: 2.75, description: "Average", isPassing: true },
      { letterGrade: "C+", minScore: 60, maxScore: 64.99, gpaPoint: 2.5, description: "Satisfactory", isPassing: true },
      { letterGrade: "C",  minScore: 55, maxScore: 59.99, gpaPoint: 2.25, description: "Passable", isPassing: true },
      { letterGrade: "D",  minScore: 50, maxScore: 54.99, gpaPoint: 2.0, description: "Marginal Pass", isPassing: true },
      { letterGrade: "F",  minScore: 0,  maxScore: 49.99, gpaPoint: 0.0, description: "Fail", isPassing: false },
    ],
  });

  console.log("-> Inserting Academic Year & Semester...");
  const ay = await prisma.academicYear.create({
    data: {
      year: "2026-2027",
      startDate: new Date("2026-09-01"),
      endDate: new Date("2027-06-30"),
      isCurrent: true,
    },
  });

  const fallSemester = await prisma.semester.create({
    data: {
      name: "Fall 2026",
      academicYearId: ay.id,
      term: 1,
      startDate: new Date("2026-09-01"),
      endDate: new Date("2027-01-20"),
      isCurrent: true,
    },
  });

  console.log("-> Inserting Departments sequentially...");
  const deptCSE = await prisma.department.create({
    data: {
      name: "Computer Science & Engineering",
      code: "CSE",
      description: "Department of Computer Science & Software Engineering",
      headOfDepartment: "Dr. Alan Turing",
    },
  });

  const deptEEE = await prisma.department.create({
    data: {
      name: "Electrical & Electronics Engineering",
      code: "EEE",
      description: "Department of Electrical Engineering",
      headOfDepartment: "Dr. Nikola Tesla",
    },
  });

  const deptBBA = await prisma.department.create({
    data: {
      name: "School of Business Administration",
      code: "BBA",
      description: "Department of Finance & Management",
      headOfDepartment: "Dr. Peter Drucker",
    },
  });

  console.log("-> Inserting Programs sequentially...");
  const progCS = await prisma.program.create({
    data: {
      name: "B.Sc. in Computer Science",
      code: "BSCS",
      departmentId: deptCSE.id,
      degreeType: "B.Sc.",
      durationYears: 4,
      totalCredits: 120,
    },
  });

  const progEE = await prisma.program.create({
    data: {
      name: "B.Sc. in Electrical Engineering",
      code: "BSEE",
      departmentId: deptEEE.id,
      degreeType: "B.Sc.",
      durationYears: 4,
      totalCredits: 128,
    },
  });

  const progBBA = await prisma.program.create({
    data: {
      name: "Bachelor of Business Administration",
      code: "BBA",
      departmentId: deptBBA.id,
      degreeType: "B.B.A.",
      durationYears: 4,
      totalCredits: 120,
    },
  });

  console.log("-> Inserting Users for all 7 Roles...");
  // 1. Super Admin
  const superAdmin = await prisma.user.create({
    data: {
      name: "System Super Administrator",
      email: "superadmin@college.edu",
      passwordHash,
      role: "SUPER_ADMIN",
      phone: "+1-555-0100",
    },
  });

  // 2. College Admin
  const collegeAdmin = await prisma.user.create({
    data: {
      name: "College Administrator",
      email: "admin@college.edu",
      passwordHash,
      role: "COLLEGE_ADMIN",
      phone: "+1-555-0101",
    },
  });

  // 3. Registrar
  const registrar = await prisma.user.create({
    data: {
      name: "Elena Rostova (Registrar)",
      email: "registrar@college.edu",
      passwordHash,
      role: "REGISTRAR",
      phone: "+1-555-0102",
      staff: {
        create: {
          employeeId: "REG-001",
          roleTitle: "Chief University Registrar",
          departmentId: deptCSE.id,
        },
      },
    },
  });

  // 4. Teachers
  const teacherUser1 = await prisma.user.create({
    data: {
      name: "Dr. Alan Turing",
      email: "teacher@college.edu",
      passwordHash,
      role: "TEACHER",
      phone: "+1-555-0103",
      teacher: {
        create: {
          employeeId: "FAC-001",
          departmentId: deptCSE.id,
          designation: "Professor & Chair",
          qualification: "Ph.D. in Computer Science",
          specialization: "Theory of Computation & AI",
          officeRoom: "Turing Hall 401",
        },
      },
    },
    include: { teacher: true },
  });

  const teacherUser2 = await prisma.user.create({
    data: {
      name: "Dr. Ada Lovelace",
      email: "ada.lovelace@college.edu",
      passwordHash,
      role: "TEACHER",
      phone: "+1-555-0104",
      teacher: {
        create: {
          employeeId: "FAC-002",
          departmentId: deptCSE.id,
          designation: "Associate Professor",
          qualification: "Ph.D. in Algorithms",
          specialization: "Algorithm Design and Analysis",
          officeRoom: "Lovelace Lab 204",
        },
      },
    },
    include: { teacher: true },
  });

  // 5. Accountant
  const accountant = await prisma.user.create({
    data: {
      name: "Carol Vance (Accountant)",
      email: "accountant@college.edu",
      passwordHash,
      role: "ACCOUNTANT",
      phone: "+1-555-0105",
      staff: {
        create: {
          employeeId: "ACC-001",
          roleTitle: "Chief Financial Officer",
          departmentId: deptBBA.id,
        },
      },
    },
  });

  // 6. Librarian
  const librarian = await prisma.user.create({
    data: {
      name: "David Wright (Librarian)",
      email: "librarian@college.edu",
      passwordHash,
      role: "LIBRARIAN",
      phone: "+1-555-0106",
      staff: {
        create: {
          employeeId: "LIB-001",
          roleTitle: "Chief Librarian",
        },
      },
    },
  });

  // 7. Students
  const studentUser1 = await prisma.user.create({
    data: {
      name: "Alice Johnson",
      email: "student@college.edu",
      passwordHash,
      role: "STUDENT",
      phone: "+1-555-0201",
      student: {
        create: {
          rollNo: "STU-2026-001",
          departmentId: deptCSE.id,
          programId: progCS.id,
          semester: 3,
          admissionDate: new Date("2025-09-01"),
          dateOfBirth: new Date("2004-05-15"),
          gender: "Female",
          bloodGroup: "O+",
          address: "742 Evergreen Terrace, Springfield",
          emergencyContactName: "Mary Johnson",
          emergencyContactPhone: "+1-555-0202",
          enrollmentStatus: "ACTIVE",
        },
      },
    },
    include: { student: true },
  });

  const studentUser2 = await prisma.user.create({
    data: {
      name: "Bob Smith",
      email: "bob.smith@college.edu",
      passwordHash,
      role: "STUDENT",
      phone: "+1-555-0203",
      student: {
        create: {
          rollNo: "STU-2026-002",
          departmentId: deptCSE.id,
          programId: progCS.id,
          semester: 3,
          admissionDate: new Date("2025-09-01"),
          dateOfBirth: new Date("2003-11-20"),
          gender: "Male",
          bloodGroup: "A+",
          address: "123 Elm Street, Cityville",
          emergencyContactName: "Robert Smith Sr.",
          emergencyContactPhone: "+1-555-0204",
          enrollmentStatus: "ACTIVE",
        },
      },
    },
    include: { student: true },
  });

  console.log("-> Inserting Courses & Sections sequentially...");
  const courseCS101 = await prisma.course.create({
    data: {
      code: "CS101",
      title: "Introduction to Computer Science",
      description: "Computing fundamentals, programming paradigms and software architecture.",
      credits: 4,
      departmentId: deptCSE.id,
      programId: progCS.id,
    },
  });

  const courseCS201 = await prisma.course.create({
    data: {
      code: "CS201",
      title: "Data Structures and Algorithms",
      description: "Linear and tree structures, graph search, and complexity analysis.",
      credits: 4,
      departmentId: deptCSE.id,
      programId: progCS.id,
    },
  });

  const courseCS301 = await prisma.course.create({
    data: {
      code: "CS301",
      title: "Relational Database Management Systems",
      description: "Database normalization, relational algebra, and SQL transactions.",
      credits: 3,
      departmentId: deptCSE.id,
      programId: progCS.id,
    },
  });

  const sectionA = await prisma.section.create({
    data: { name: "Section A", semesterId: fallSemester.id, maxCapacity: 45, room: "Hall 101" },
  });

  const sectionB = await prisma.section.create({
    data: { name: "Section B", semesterId: fallSemester.id, maxCapacity: 40, room: "Lab 202" },
  });

  console.log("-> Course Assignments & Timetables...");
  await prisma.courseAssignment.createMany({
    data: [
      { teacherId: teacherUser1.teacher.id, courseId: courseCS101.id, sectionId: sectionA.id, role: "PRIMARY" },
      { teacherId: teacherUser2.teacher.id, courseId: courseCS201.id, sectionId: sectionA.id, role: "PRIMARY" },
      { teacherId: teacherUser1.teacher.id, courseId: courseCS301.id, sectionId: sectionB.id, role: "PRIMARY" },
    ],
  });

  await prisma.timetable.createMany({
    data: [
      { courseId: courseCS101.id, sectionId: sectionA.id, day: "Monday", startTime: "09:00", endTime: "10:30", room: "Hall 101", building: "Main Hall" },
      { courseId: courseCS101.id, sectionId: sectionA.id, day: "Wednesday", startTime: "09:00", endTime: "10:30", room: "Hall 101", building: "Main Hall" },
      { courseId: courseCS201.id, sectionId: sectionA.id, day: "Tuesday", startTime: "11:00", endTime: "12:30", room: "Lab 204", building: "Science Wing" },
      { courseId: courseCS301.id, sectionId: sectionB.id, day: "Friday", startTime: "14:00", endTime: "16:00", room: "Lab 3", building: "IT Center" },
    ],
  });

  console.log("-> Enrollments sequentially...");
  const enrollAliceCS101 = await prisma.enrollment.create({
    data: { studentId: studentUser1.student.id, courseId: courseCS101.id, semesterId: fallSemester.id, sectionId: sectionA.id },
  });

  const enrollAliceCS201 = await prisma.enrollment.create({
    data: { studentId: studentUser1.student.id, courseId: courseCS201.id, semesterId: fallSemester.id, sectionId: sectionA.id },
  });

  const enrollBobCS101 = await prisma.enrollment.create({
    data: { studentId: studentUser2.student.id, courseId: courseCS101.id, semesterId: fallSemester.id, sectionId: sectionA.id },
  });

  console.log("-> Attendance sessions & records...");
  const session1 = await prisma.attendanceSession.create({
    data: {
      courseId: courseCS101.id,
      sectionId: sectionA.id,
      teacherId: teacherUser1.teacher.id,
      date: new Date("2026-10-06T09:00:00Z"),
      topic: "Introduction to Complexity & Big-O",
      room: "Hall 101",
    },
  });

  await prisma.attendanceRecord.createMany({
    data: [
      { sessionId: session1.id, studentId: studentUser1.student.id, enrollmentId: enrollAliceCS101.id, status: "PRESENT", remarks: "Active participation" },
      { sessionId: session1.id, studentId: studentUser2.student.id, enrollmentId: enrollBobCS101.id, status: "LATE", remarks: "10 min late" },
    ],
  });

  console.log("-> Exams & Marks...");
  const examMidterm = await prisma.exam.create({
    data: {
      title: "CS101 Midterm Examination Fall 2026",
      examType: "MIDTERM",
      courseId: courseCS101.id,
      semesterId: fallSemester.id,
      examDate: new Date("2026-10-25T10:00:00Z"),
      startTime: "10:00",
      endTime: "12:00",
      room: "Auditorium West",
      totalMarks: 100,
      weightagePercent: 30,
      isPublished: true,
      publishedAt: new Date(),
    },
  });

  const assessWritten = await prisma.assessment.create({
    data: { examId: examMidterm.id, title: "Theory & Programming Problems", maxMarks: 100, weightage: 100 },
  });

  await prisma.mark.createMany({
    data: [
      {
        examId: examMidterm.id,
        assessmentId: assessWritten.id,
        studentId: studentUser1.student.id,
        enrollmentId: enrollAliceCS101.id,
        score: 94.5,
        feedback: "Outstanding algorithmic analysis.",
        letterGrade: "A+",
        gradePoint: 4.0,
        isPublished: true,
        recordedById: teacherUser1.id,
      },
      {
        examId: examMidterm.id,
        assessmentId: assessWritten.id,
        studentId: studentUser2.student.id,
        enrollmentId: enrollBobCS101.id,
        score: 78.0,
        feedback: "Good work, practice recursion.",
        letterGrade: "B+",
        gradePoint: 3.25,
        isPublished: true,
        recordedById: teacherUser1.id,
      },
    ],
  });

  console.log("-> Fees, Invoices & Payments...");
  const invoiceAlice = await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-2026-0001",
      studentId: studentUser1.student.id,
      semesterId: fallSemester.id,
      issueDate: new Date("2026-09-01"),
      dueDate: new Date("2026-10-31"),
      totalAmount: 3700,
      paidAmount: 2000,
      balance: 1700,
      status: "PARTIALLY_PAID",
      notes: "Fall 2026 Semester Fees",
      feeItems: {
        create: [
          { title: "Fall 2026 Tuition", amount: 3200 },
          { title: "Lab Computing Fee", amount: 350 },
          { title: "Library License Fee", amount: 150 },
        ],
      },
    },
  });

  await prisma.payment.create({
    data: {
      paymentNumber: "PAY-2026-0001",
      invoiceId: invoiceAlice.id,
      amount: 2000,
      paymentMethod: "BANK_TRANSFER",
      transactionRef: "WIRE-TXN-984210",
      recordedById: accountant.id,
      status: "COMPLETED",
      notes: "Wire transfer installment 1",
    },
  });

  console.log("-> Library books & loans...");
  const bookCleanCode = await prisma.book.create({
    data: {
      isbn: "978-0132350884",
      title: "Clean Code: A Handbook of Agile Software Craftsmanship",
      author: "Robert C. Martin",
      publisher: "Prentice Hall",
      publicationYear: 2008,
      category: "Software Engineering",
      totalCopies: 5,
      availableCopies: 4,
      shelfLocation: "Section C, Shelf 4",
      copies: {
        create: [
          { barcode: "BC-CC-001", copyNumber: 1, status: "BORROWED" },
          { barcode: "BC-CC-002", copyNumber: 2, status: "AVAILABLE" },
        ],
      },
    },
    include: { copies: true },
  });

  await prisma.bookLoan.create({
    data: {
      bookId: bookCleanCode.id,
      bookCopyId: bookCleanCode.copies[0].id,
      userId: studentUser1.id,
      borrowDate: new Date("2026-10-01"),
      dueDate: new Date("2026-10-22"),
      status: "BORROWED",
    },
  });

  console.log("-> Announcements & Notifications...");
  await prisma.announcement.createMany({
    data: [
      {
        authorId: collegeAdmin.id,
        title: "Welcome to Academic Year 2026-2027",
        body: "Classes commence Monday. Welcome students, faculty, and staff!",
        audience: "ALL",
        priority: "HIGH",
      },
      {
        authorId: teacherUser1.id,
        title: "CS101 Midterm Examination Schedule",
        body: "The midterm examination will take place in Auditorium West on Oct 25 at 10:00 AM.",
        audience: "STUDENTS",
        priority: "URGENT",
      },
    ],
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: studentUser1.id,
        title: "Midterm Result Published",
        message: "Your score for CS101 Midterm is 94.5/100 (Grade: A+).",
        type: "EXAM",
        isRead: false,
      },
      {
        userId: studentUser1.id,
        title: "Payment Receipt Issued",
        message: "Payment of $2,000 for INV-2026-0001 confirmed.",
        type: "FEE",
        isRead: true,
      },
    ],
  });

  await prisma.auditLog.create({
    data: {
      userId: superAdmin.id,
      action: "INITIAL_DATABASE_SEED",
      entity: "System",
      details: JSON.stringify({ message: "Seeded system with 7 roles and core academic data" }),
      ipAddress: "127.0.0.1",
    },
  });

  console.log("🎉 Database seeded successfully with all 7 roles!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });