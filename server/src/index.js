import "dotenv/config";
import express from "express";
import cors from "cors";

// Routes
import authRoutes from "./routes/authRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import teacherRoutes from "./routes/teacherRoutes.js";
import staffRoutes from "./routes/staffRoutes.js";
import academicRoutes from "./routes/academicRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import examRoutes from "./routes/examRoutes.js";
import financeRoutes from "./routes/financeRoutes.js";
import libraryRoutes from "./routes/libraryRoutes.js";
import communicationRoutes from "./routes/communicationRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import { openapiSpec } from "./utils/openapiSpec.js";

const app = express();

app.use(cors());
app.use(express.json());

// API Health
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "College Management System REST API",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// Interactive Swagger UI & OpenAPI JSON Spec
app.get("/api/docs.json", (req, res) => {
  res.json(openapiSpec);
});

app.get("/api/docs", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>College Management System API Documentation</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
  <style>
    body { margin: 0; background: #fafafa; font-family: sans-serif; }
    .swagger-ui .topbar { display: none; }
    .header-banner { background: #1e1b4b; color: #fff; padding: 18px 24px; font-weight: 600; font-size: 20px; }
  </style>
</head>
<body>
  <div class="header-banner">🎓 College Management System — Interactive API Docs</div>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: '/api/docs.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [SwaggerUIBundle.presets.apis],
      });
    };
  </script>
</body>
</html>
  `);
});

// Module Endpoints
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/academics", academicRoutes);
// Compatibility aliases for previous routes
app.use("/api/departments", academicRoutes);
app.use("/api/courses", academicRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/finance", financeRoutes);
app.use("/api/library", libraryRoutes);
app.use("/api/communication", communicationRoutes);
app.use("/api/announcements", communicationRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/admin", adminRoutes);

// Centralized error handler
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Invalid JSON in request body" });
  }
  if (err.code === "P2002") {
    return res.status(409).json({ message: "A unique record with this key already exists in the database." });
  }
  if (err.code === "P2025") {
    return res.status(404).json({ message: "Requested record not found." });
  }
  if (err.code === "P2003") {
    return res.status(409).json({
      message: "This record is linked to other database entities or foreign key constraints.",
    });
  }
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Internal server error", error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 College Management System Server running on http://localhost:${PORT}`);
  console.log(`📖 API Documentation available at http://localhost:${PORT}/api/docs`);
});