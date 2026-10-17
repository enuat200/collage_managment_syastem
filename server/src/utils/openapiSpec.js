export const openapiSpec = {
  openapi: "3.0.0",
  info: {
    title: "College Management System (CMS) API",
    version: "1.0.0",
    description:
      "Enterprise REST API for modern higher-education administration, RBAC security, student records, academics, attendance, examinations, fee processing, and library operations.",
  },
  servers: [{ url: "/api", description: "Default API Gateway" }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    "/auth/login": {
      post: {
        summary: "User authentication",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  email: { type: "string" },
                  password: { type: "string" },
                },
                required: ["email", "password"],
              },
            },
          },
        },
        responses: { 200: { description: "Returns token and user profile" } },
      },
    },
    "/auth/me": {
      get: { summary: "Get current authenticated profile", responses: { 200: { description: "Current user" } } },
    },
    "/dashboard/stats": {
      get: { summary: "Fetch role-tailored dashboard metrics and widgets", responses: { 200: { description: "Stats" } } },
    },
    "/students": {
      get: { summary: "List students with search and pagination", responses: { 200: { description: "Student list" } } },
      post: { summary: "Register new student with user account", responses: { 201: { description: "Created" } } },
    },
    "/teachers": {
      get: { summary: "List teachers and faculty profiles", responses: { 200: { description: "Teacher list" } } },
      post: { summary: "Create teacher profile", responses: { 201: { description: "Created" } } },
    },
    "/staff": {
      get: { summary: "List administrative staff (Registrar, Accountant, Librarian)", responses: { 200: { description: "Staff list" } } },
      post: { summary: "Create staff account", responses: { 201: { description: "Created" } } },
    },
    "/academics/departments": {
      get: { summary: "List departments", responses: { 200: { description: "Departments" } } },
    },
    "/academics/courses": {
      get: { summary: "List courses", responses: { 200: { description: "Courses" } } },
    },
    "/academics/timetables": {
      get: { summary: "List timetable slots", responses: { 200: { description: "Timetables" } } },
      post: { summary: "Create timetable slot with conflict detection", responses: { 201: { description: "Created" } } },
    },
    "/attendance/sessions": {
      get: { summary: "List attendance sessions", responses: { 200: { description: "Sessions" } } },
      post: { summary: "Record batch attendance session", responses: { 201: { description: "Recorded" } } },
    },
    "/exams": {
      get: { summary: "List examinations", responses: { 200: { description: "Exams" } } },
      post: { summary: "Create exam schedule", responses: { 201: { description: "Created" } } },
    },
    "/exams/{id}/marks": {
      post: { summary: "Enter and calculate marks with GradeScale GPA", responses: { 200: { description: "Marks entered" } } },
    },
    "/finance/invoices": {
      get: { summary: "List student tuition invoices", responses: { 200: { description: "Invoices" } } },
      post: { summary: "Generate new invoice", responses: { 201: { description: "Created" } } },
    },
    "/finance/payments": {
      post: { summary: "Process invoice payment with ACID transaction", responses: { 201: { description: "Processed" } } },
    },
    "/library/books": {
      get: { summary: "Catalog book search", responses: { 200: { description: "Books" } } },
      post: { summary: "Add book to catalog", responses: { 201: { description: "Added" } } },
    },
    "/library/loans": {
      post: { summary: "Borrow book and track copy barcode", responses: { 201: { description: "Loan created" } } },
    },
    "/announcements": {
      get: { summary: "List announcements by role audience", responses: { 200: { description: "Announcements" } } },
    },
    "/reports/enrollment": {
      get: { summary: "Student enrollment report", responses: { 200: { description: "Enrollment metrics" } } },
    },
    "/admin/audit-logs": {
      get: { summary: "System security audit log records", responses: { 200: { description: "Audit trail" } } },
    },
  },
};
