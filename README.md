# UniManage - Full-Stack College Management System (CMS)

A modern, responsive, enterprise-grade College Management System built with **React**, **Node.js/Express**, **Prisma ORM**, and **PostgreSQL**.

---

## 🏛️ System Features & User Roles

UniManage implements a granular **Role-Based Access Control (RBAC)** architecture supporting 7 distinct user personas:

| # | Role | Capabilities & Portal Scope |
|---|------|-----------------------------|
| 1 | **Super Admin** | Full governance: system settings, user account lifecycle (activate/deactivate), security audit log inspections, grading policy configuration. |
| 2 | **College Administrator** | Institutional oversight: department budgets, academic programs, faculty hiring, facility management, macro analytics. |
| 3 | **Registrar** | Admissions & records: student admissions, degree programs, semester calendar, enrollments, course catalogs, student records. |
| 4 | **Teacher** | Classroom management: assigned classes, interactive student roll call & attendance, exam marks grading, lecture timetables. |
| 5 | **Student** | Academic student portal: personal profile, course enrollments, attendance rate, class schedules, published results, fee balance, official academic transcripts. |
| 6 | **Accountant** | Bursar operations: fee structures, invoice generation, payment reconciliation, partial payment handling, financial summaries. |
| 7 | **Librarian** | Media center: physical catalog inventory, ISBN tracking, copy checkouts/returns, automated overdue fine calculation ($1/day). |

---

## 🛠️ Technology Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4, Recharts, Lucide React icons.
- **Backend**: Node.js (ES Modules), Express.js, Prisma ORM.
- **Database**: PostgreSQL (Neon Cloud Serverless Database).
- **Security & Auth**: JWT (JSON Web Tokens), bcrypt password hashing, input validation schemas, centralized audit logging.
- **Documentation**: Built-in Interactive Swagger / OpenAPI UI at `/api/docs`.
- **Testing**: Node.js native test runner (`node:test`, `node:assert/strict`).

---

## 🚀 Quick Start & Development Setup

### Prerequisites
- Node.js >= 20.x
- PostgreSQL instance (or Neon connection string)

### 1. Backend Server Setup
```bash
cd server
npm install

# Configure environment variables
cp .env.example .env
# Edit .env and supply your DATABASE_URL and JWT_SECRET

# Run database migrations
npx prisma migrate dev --name init

# Seed development dataset (departments, courses, staff, students, books, invoices)
npm run seed

# Run automated tests
npm test

# Start backend development server (runs on http://localhost:5000)
npm run dev
```

### 2. Frontend Client Setup
```bash
cd client
npm install

# Start Vite dev server (runs on http://localhost:3000 with proxy to localhost:5000)
npm run dev

# Or build for production
npm run build
```

---

## 🔐 Development Seed Accounts

All development demo accounts use the standard password: `Admin@123`

The application includes an **instant 1-click Demo Role Switcher** on the login page and in the top navigation bar to test every persona immediately:

| Role | Demo Email | Password |
|------|------------|----------|
| **Super Admin** | `superadmin@college.edu` | `Admin@123` |
| **College Admin** | `admin@college.edu` | `Admin@123` |
| **Registrar** | `registrar@college.edu` | `Admin@123` |
| **Teacher** | `teacher@college.edu` | `Admin@123` |
| **Student** | `student@college.edu` | `Admin@123` |
| **Accountant** | `accountant@college.edu` | `Admin@123` |
| **Librarian** | `librarian@college.edu` | `Admin@123` |

---

## 👤 Creating the First Administrator Account

To bootstrap a new installation without seed data, run the Node seed script or execute the following snippet in your database terminal:

```javascript
import bcrypt from 'bcryptjs';
import prisma from './src/config/prisma.js';

const hash = await bcrypt.hash('YourSecurePassword', 10);
await prisma.user.create({
  data: {
    name: 'Primary Administrator',
    email: 'admin@yourcollege.edu',
    passwordHash: hash,
    role: 'SUPER_ADMIN',
    isActive: true,
  },
});
```

---

## 🧪 Automated Testing

Automated integration tests verify critical workflows:
- Password hashing & bcrypt verification
- Role payload JWT token generation
- Dynamic letter grade (A+, A, B, etc.) and GPA quality point computation
- Role existence verification across the 7 personas
- Financial transaction ledger consistency (invoices, partial payments, and balance calculations)
- Library copy availability and borrowing status
- Timetable conflict detection (prevents overlapping classroom reservations)

Execute tests via:
```bash
cd server
npm test
```

---

## 📖 API Documentation

An interactive Swagger UI and OpenAPI 3.0 specification are built directly into the backend server:
- Interactive Swagger UI: `http://localhost:5000/api/docs`
- OpenAPI JSON Schema: `http://localhost:5000/api/docs.json`
- Health Endpoint: `http://localhost:5000/api/health`

---

## 🌐 Production Deployment Guidance

1. **Frontend**:
   - Run `npm run build` in `/client` to generate the static bundle in `/client/dist`.
   - Host on Vercel, Netlify, Cloudflare Pages, or AWS S3/CloudFront.
   - Configure environment variables to point `/api` requests to your backend production URL.

2. **Backend**:
   - Deploy `/server` to Render, Railway, Fly.io, or AWS ECS/App Runner.
   - Set environment variables: `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, and `PORT`.
   - Run `npx prisma migrate deploy` in your CI/CD pipeline before starting the web process.

3. **Database**:
   - Neon serverless PostgreSQL, AWS RDS PostgreSQL, or Supabase.
   - Enable connection pooling with PgBouncer for high-concurrency environments.
