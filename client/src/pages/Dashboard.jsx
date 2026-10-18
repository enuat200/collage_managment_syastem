import React, { useEffect, useState } from 'react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { StatCard, Card } from '../components/common/Card.jsx';
import { RoleBadge, StatusBadge } from '../components/common/Badge.jsx';
import { LoadingSpinner, EmptyState } from '../components/common/LoadingAndEmpty.jsx';
import {
  Users,
  GraduationCap,
  Briefcase,
  BookOpen,
  DollarSign,
  Calendar,
  Clock,
  AlertTriangle,
  Library,
  TrendingUp,
  Award,
  Bell,
  ArrowRight,
  Sparkles,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { COLLEGE_IMAGES } from '../assets/collegeImages.js';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export const Dashboard = ({ onNavigate }) => {
  const { user, role } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/stats');
      setData(res);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setError(err.message || 'Error loading dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [role]);

  if (loading) return <LoadingSpinner text="Loading dashboard statistics..." />;
  if (error) {
    return (
      <div className="p-6 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300">
        <p className="font-semibold">Unable to load dashboard</p>
        <p className="text-sm mt-1">{error}</p>
        <button
          onClick={fetchStats}
          className="mt-3 px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-medium"
        >
          Try Again
        </button>
      </div>
    );
  }

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

  return (
    <div className="space-y-6">
      {/* Welcome Banner with University Campus Background */}
      <div className="relative rounded-2xl overflow-hidden shadow-xl text-white border border-indigo-400/20">
        {/* Background Campus Photo */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-105"
          style={{ backgroundImage: `url(${COLLEGE_IMAGES.campuses.modernCampus})` }}
        />
        {/* Multi-tier Gradient for rich contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-indigo-950/85 to-violet-950/75 backdrop-blur-[1px]" />
        
        {/* Banner Content */}
        <div className="relative z-10 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-[11px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                UniManage Academic Portal
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/20 text-white backdrop-blur-xs">
                {role.replace('_', ' ')}
              </span>
              <span className="text-xs text-indigo-200/90 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-indigo-300" />
                Main Campus Quad &bull; Term Fall 2026
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white drop-shadow-md">
              Welcome back, {user?.name || 'Academic Scholar'}!
            </h2>
            <p className="text-indigo-100 text-xs sm:text-sm mt-1.5 leading-relaxed drop-shadow">
              Here is your centralized institutional overview. Monitor student matriculation, dynamic grading curves, library checkout circulation, and bursar payment receipts.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                onClick={() => onNavigate && onNavigate('academics')}
                className="px-3.5 py-1.5 rounded-xl bg-white text-slate-900 text-xs font-bold hover:bg-slate-100 transition shadow-sm flex items-center gap-1.5"
              >
                <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                Browse Course Catalog
              </button>
              <button
                onClick={() => onNavigate && onNavigate('library')}
                className="px-3.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold backdrop-blur-sm border border-white/20 transition flex items-center gap-1.5"
              >
                <Library className="w-3.5 h-3.5 text-indigo-200" />
                Access Digital Library
              </button>
            </div>
          </div>

          <div className="hidden lg:flex flex-col items-end text-right shrink-0">
            <div className="p-3.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-xs">
              <p className="text-slate-300 text-[11px]">University Operations</p>
              <p className="text-emerald-400 font-bold flex items-center gap-1.5 justify-end mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                All Systems Operational
              </p>
              <div className="mt-2 pt-2 border-t border-white/10 text-[10px] text-slate-300 flex items-center gap-1">
                <Clock className="w-3 h-3 text-indigo-300" />
                Last synchronized just now
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Role-Specific Metric Cards */}
      {renderMetrics(role, data)}

      {/* Campus Academic Facilities & Visual Highlights */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Campus Centers & Academic Facilities
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Direct access to university schools, specialized laboratories, and student study centers
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Grand Alexander Library */}
          <div
            onClick={() => onNavigate && onNavigate('library')}
            className="group relative rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border border-slate-200 dark:border-slate-800 bg-slate-900 flex flex-col justify-end min-h-[190px]"
          >
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
              style={{ backgroundImage: `url(${COLLEGE_IMAGES.facilities.grandLibrary})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
            <div className="relative z-10 p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                Open 24/7
              </span>
              <h4 className="text-sm font-bold text-white mt-1 group-hover:text-amber-300 transition flex items-center justify-between">
                Alexander Grand Library
                <ArrowRight className="w-3.5 h-3.5 text-white/60 group-hover:text-amber-300 group-hover:translate-x-1 transition" />
              </h4>
              <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-1">
                50,000+ Volumes &bull; Digital Archives &bull; Quiet Study
              </p>
            </div>
          </div>

          {/* Card 2: Computing & AI Center */}
          <div
            onClick={() => onNavigate && onNavigate('academics')}
            className="group relative rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border border-slate-200 dark:border-slate-800 bg-slate-900 flex flex-col justify-end min-h-[190px]"
          >
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
              style={{ backgroundImage: `url(${COLLEGE_IMAGES.facilities.computerLab})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
            <div className="relative z-10 p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500 text-white">
                Tech & AI
              </span>
              <h4 className="text-sm font-bold text-white mt-1 group-hover:text-indigo-300 transition flex items-center justify-between">
                Turing Computing Hub
                <ArrowRight className="w-3.5 h-3.5 text-white/60 group-hover:text-indigo-300 group-hover:translate-x-1 transition" />
              </h4>
              <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-1">
                High Performance Cluster &bull; Robotics &bull; Hackathons
              </p>
            </div>
          </div>

          {/* Card 3: Science & Medical Labs */}
          <div
            onClick={() => onNavigate && onNavigate('academics')}
            className="group relative rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border border-slate-200 dark:border-slate-800 bg-slate-900 flex flex-col justify-end min-h-[190px]"
          >
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
              style={{ backgroundImage: `url(${COLLEGE_IMAGES.facilities.scienceLab})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
            <div className="relative z-10 p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500 text-white">
                Research Labs
              </span>
              <h4 className="text-sm font-bold text-white mt-1 group-hover:text-emerald-300 transition flex items-center justify-between">
                Biomedical Research Complex
                <ArrowRight className="w-3.5 h-3.5 text-white/60 group-hover:text-emerald-300 group-hover:translate-x-1 transition" />
              </h4>
              <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-1">
                Clinical Simulation &bull; Bio-Genomics &bull; Chemistry
              </p>
            </div>
          </div>

          {/* Card 4: Athletics & Student Life */}
          <div
            onClick={() => onNavigate && onNavigate('announcements')}
            className="group relative rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border border-slate-200 dark:border-slate-800 bg-slate-900 flex flex-col justify-end min-h-[190px]"
          >
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
              style={{ backgroundImage: `url(${COLLEGE_IMAGES.facilities.sportsStadium})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
            <div className="relative z-10 p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-500 text-white">
                Athletics
              </span>
              <h4 className="text-sm font-bold text-white mt-1 group-hover:text-sky-300 transition flex items-center justify-between">
                University Sports Pavilion
                <ArrowRight className="w-3.5 h-3.5 text-white/60 group-hover:text-sky-300 group-hover:translate-x-1 transition" />
              </h4>
              <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-1">
                Olympic Track &bull; Indoor Arena &bull; 18 Varsity Teams
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Charts & Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Visualizations / Primary Content */}
        <div className="lg:col-span-2 space-y-6">
          {renderPrimarySection(role, data, onNavigate, COLORS)}
        </div>

        {/* Right Col: Announcements & Secondary Activities */}
        <div className="space-y-6">
          {/* Announcements Card */}
          <Card title="Campus Announcements" subtitle="Latest notices and bulletins">
            <div className="space-y-3">
              {(!data?.announcements || data.announcements.length === 0) ? (
                <p className="text-xs text-slate-400 py-4 text-center">No announcements at this time.</p>
              ) : (
                data.announcements.map((a) => (
                  <div
                    key={a.id}
                    className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                        {a.title}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          a.priority === 'URGENT'
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400'
                            : a.priority === 'HIGH'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                            : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400'
                        }`}
                      >
                        {a.priority}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">{a.content}</p>
                    <p className="text-[10px] text-slate-400 pt-1">
                      Posted by {a.author?.name} &bull; {new Date(a.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Featured Campus Event Poster */}
          <div className="relative rounded-2xl overflow-hidden shadow-md border border-slate-200 dark:border-slate-800 bg-slate-900 group">
            <div
              className="h-36 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
              style={{ backgroundImage: `url(${COLLEGE_IMAGES.events.convocation})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent pointer-events-none" />
            <div className="relative p-4 text-white -mt-16">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-semibold">
                Major Campus Event
              </span>
              <h4 className="text-sm font-bold mt-1 text-white">
                Annual University Commencement & Honors
              </h4>
              <p className="text-xs text-slate-200 mt-0.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-300" />
                Grand Auditorium &bull; May 24, 2026
              </p>
            </div>
          </div>

          {/* Quick Access Card */}
          <Card title="Quick Navigation" subtitle="Common workflows">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => onNavigate && onNavigate('students')}
                className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-600 text-left font-medium text-slate-700 dark:text-slate-300 hover:bg-indigo-50/50 dark:hover:bg-slate-800 transition"
              >
                👥 Students Directory
              </button>
              <button
                onClick={() => onNavigate && onNavigate('attendance')}
                className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-600 text-left font-medium text-slate-700 dark:text-slate-300 hover:bg-indigo-50/50 dark:hover:bg-slate-800 transition"
              >
                📅 Class Attendance
              </button>
              <button
                onClick={() => onNavigate && onNavigate('exams')}
                className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-600 text-left font-medium text-slate-700 dark:text-slate-300 hover:bg-indigo-50/50 dark:hover:bg-slate-800 transition"
              >
                📝 Exams & Grades
              </button>
              <button
                onClick={() => onNavigate && onNavigate('finance')}
                className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-600 text-left font-medium text-slate-700 dark:text-slate-300 hover:bg-indigo-50/50 dark:hover:bg-slate-800 transition"
              >
                💳 Fees & Billing
              </button>
              <button
                onClick={() => onNavigate && onNavigate('library')}
                className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-600 text-left font-medium text-slate-700 dark:text-slate-300 hover:bg-indigo-50/50 dark:hover:bg-slate-800 transition"
              >
                📚 Library Catalog
              </button>
              <button
                onClick={() => onNavigate && onNavigate('academics')}
                className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-600 text-left font-medium text-slate-700 dark:text-slate-300 hover:bg-indigo-50/50 dark:hover:bg-slate-800 transition"
              >
                🏛️ Academic Programs
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Sub-renderers for Metrics
function renderMetrics(role, data) {
  const m = data?.metrics || {};

  switch (role) {
    case 'SUPER_ADMIN':
    case 'COLLEGE_ADMIN':
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Students"
            value={m.totalStudents ?? 0}
            icon={GraduationCap}
            color="indigo"
          />
          <StatCard
            title="Faculty Members"
            value={m.totalTeachers ?? 0}
            icon={Briefcase}
            color="emerald"
          />
          <StatCard
            title="Active Courses"
            value={m.totalCourses ?? 0}
            icon={BookOpen}
            color="sky"
          />
          <StatCard
            title="Fees Collected"
            value={`$${Number(m.totalCollected || 0).toLocaleString()}`}
            icon={DollarSign}
            color="purple"
          />
        </div>
      );

    case 'REGISTRAR':
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Enrolled Students"
            value={m.totalStudents ?? 0}
            icon={GraduationCap}
            color="indigo"
          />
          <StatCard
            title="Active Status"
            value={m.activeStudents ?? 0}
            icon={Users}
            color="emerald"
          />
          <StatCard
            title="Degree Programs"
            value={m.totalPrograms ?? 0}
            icon={BookOpen}
            color="purple"
          />
          <StatCard
            title="Graduated Alumni"
            value={m.graduatedStudents ?? 0}
            icon={Award}
            color="sky"
          />
        </div>
      );

    case 'TEACHER':
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Assigned Courses"
            value={m.assignedCourses ?? 0}
            icon={BookOpen}
            color="indigo"
          />
          <StatCard
            title="Enrolled Students"
            value={m.totalStudents ?? 0}
            icon={Users}
            color="emerald"
          />
          <StatCard
            title="Upcoming Exams"
            value={m.upcomingExamsCount ?? 0}
            icon={Award}
            color="amber"
          />
          <StatCard
            title="Sessions Recorded"
            value={m.sessionsConducted ?? 0}
            icon={Calendar}
            color="purple"
          />
        </div>
      );

    case 'STUDENT':
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Enrolled Courses"
            value={m.enrolledCourses ?? 0}
            icon={BookOpen}
            color="indigo"
          />
          <StatCard
            title="Attendance Rate"
            value={`${m.attendancePercentage ?? 100}%`}
            icon={Calendar}
            color="emerald"
          />
          <StatCard
            title="Outstanding Balance"
            value={`$${Number(m.totalBalance || 0).toLocaleString()}`}
            icon={DollarSign}
            color="rose"
          />
          <StatCard
            title="Total Paid"
            value={`$${Number(m.totalPaid || 0).toLocaleString()}`}
            icon={DollarSign}
            color="purple"
          />
        </div>
      );

    case 'ACCOUNTANT':
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Invoiced"
            value={`$${Number(m.totalInvoiced || 0).toLocaleString()}`}
            icon={DollarSign}
            color="indigo"
          />
          <StatCard
            title="Revenue Collected"
            value={`$${Number(m.totalCollected || 0).toLocaleString()}`}
            icon={DollarSign}
            color="emerald"
          />
          <StatCard
            title="Outstanding Balance"
            value={`$${Number(m.outstandingBalance || 0).toLocaleString()}`}
            icon={AlertTriangle}
            color="rose"
          />
          <StatCard
            title="Collection Rate"
            value={`${m.collectionRate ?? 0}%`}
            icon={TrendingUp}
            color="purple"
          />
        </div>
      );

    case 'LIBRARIAN':
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Catalog Titles"
            value={m.totalBooks ?? 0}
            icon={BookOpen}
            color="indigo"
          />
          <StatCard
            title="Physical Copies"
            value={m.totalCopies ?? 0}
            icon={Library}
            color="emerald"
          />
          <StatCard
            title="Active Borrowings"
            value={m.activeLoans ?? 0}
            icon={Users}
            color="amber"
          />
          <StatCard
            title="Overdue Returns"
            value={m.overdueLoans ?? 0}
            icon={AlertTriangle}
            color="rose"
          />
        </div>
      );

    default:
      return null;
  }
}

// Sub-renderers for Primary Dashboard Sections
function renderPrimarySection(role, data, onNavigate, COLORS) {
  if (role === 'SUPER_ADMIN' || role === 'COLLEGE_ADMIN') {
    return (
      <>
        {/* Department Distribution Chart */}
        <Card title="Department Statistics" subtitle="Student enrollments across academic departments">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.departmentStats || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="name" fontSize={11} stroke="#94a3b8" />
                <YAxis fontSize={11} stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderColor: '#334155',
                    color: '#fff',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="students" name="Students" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="teachers" name="Faculty" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Recent Audit Logs & Recent Students */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card title="Recent Activity Logs" subtitle="Security & change audit trail">
            <div className="space-y-2 text-xs max-h-60 overflow-y-auto">
              {(data?.recentAudits || []).map((audit) => (
                <div
                  key={audit.id}
                  className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800"
                >
                  <div className="flex items-center justify-between font-semibold text-slate-800 dark:text-slate-200">
                    <span>{audit.action}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(audit.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    User: {audit.user?.name} &bull; {audit.entity} #{audit.entityId}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Recent Admissions" subtitle="Newly enrolled student profiles">
            <div className="space-y-2 text-xs max-h-60 overflow-y-auto">
              {(data?.recentStudents || []).map((student) => (
                <div
                  key={student.id}
                  className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{student.user?.name}</p>
                    <p className="text-[11px] text-slate-400">
                      Roll: {student.rollNo} &bull; {student.department?.code}
                    </p>
                  </div>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                    Active
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </>
    );
  }

  if (role === 'TEACHER') {
    return (
      <>
        {/* Teaching Timetable */}
        <Card title="Teaching Schedule" subtitle="Assigned lectures and laboratory sessions">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700 text-slate-400">
                  <th className="py-2 px-3">Day</th>
                  <th className="py-2 px-3">Time</th>
                  <th className="py-2 px-3">Course</th>
                  <th className="py-2 px-3">Room</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(data?.timetables || []).map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">{t.day}</td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                      {t.startTime} - {t.endTime}
                    </td>
                    <td className="py-2.5 px-3 text-indigo-600 dark:text-indigo-400 font-medium">
                      {t.course?.code}: {t.course?.title}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 font-mono">{t.room}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Upcoming Exams & Grading */}
        <Card title="Exams to Grade" subtitle="Active assessments awaiting or scheduled for marks entry">
          <div className="space-y-2 text-xs">
            {(data?.upcomingExams || []).map((exam) => (
              <div
                key={exam.id}
                className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{exam.title}</p>
                  <p className="text-[11px] text-slate-400">
                    Course: {exam.course?.code} &bull; Date: {new Date(exam.examDate).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => onNavigate && onNavigate('exams')}
                  className="px-2.5 py-1 bg-indigo-600 text-white rounded-md text-[11px] font-medium hover:bg-indigo-700"
                >
                  Grade Marks
                </button>
              </div>
            ))}
          </div>
        </Card>
      </>
    );
  }

  if (role === 'STUDENT') {
    const enrollments = data?.enrollments || [];
    return (
      <>
        {/* Student Enrolled Courses */}
        <Card title="My Enrolled Courses" subtitle="Current semester coursework and credit units">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700 text-slate-400">
                  <th className="py-2 px-3">Code</th>
                  <th className="py-2 px-3">Course Title</th>
                  <th className="py-2 px-3">Credits</th>
                  <th className="py-2 px-3">Section</th>
                  <th className="py-2 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {enrollments.map((enr) => (
                  <tr key={enr.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-semibold text-indigo-600 dark:text-indigo-400">
                      {enr.course?.code}
                    </td>
                    <td className="py-2.5 px-3 text-slate-800 dark:text-slate-200 font-medium">
                      {enr.course?.title}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">{enr.course?.credits} Credits</td>
                    <td className="py-2.5 px-3 text-slate-500">{enr.section?.name || 'Main'}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        {enr.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Timetable */}
        <Card title="My Class Schedule" subtitle="Weekly lecture timetable">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {(data?.timetables || []).map((t) => (
              <div
                key={t.id}
                className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200">{t.day}</span>
                  <span className="text-slate-500 font-mono text-[11px]">
                    {t.startTime} - {t.endTime}
                  </span>
                </div>
                <p className="text-indigo-600 dark:text-indigo-400 font-medium">
                  {t.course?.code}: {t.course?.title}
                </p>
                <p className="text-slate-400 text-[11px]">Room: {t.room}</p>
              </div>
            ))}
          </div>
        </Card>
      </>
    );
  }

  if (role === 'ACCOUNTANT') {
    return (
      <>
        {/* Pending Invoices */}
        <Card title="Outstanding Invoices" subtitle="Accounts receivable awaiting settlement">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700 text-slate-400">
                  <th className="py-2 px-3">Invoice #</th>
                  <th className="py-2 px-3">Student</th>
                  <th className="py-2 px-3">Due Date</th>
                  <th className="py-2 px-3">Balance</th>
                  <th className="py-2 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(data?.pendingInvoices || []).map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-2.5 px-3 text-slate-800 dark:text-slate-200">
                      {inv.student?.user?.name}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">
                      {new Date(inv.dueDate).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-rose-600">
                      ${Number(inv.balance).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status={inv.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Recent Payments */}
        <Card title="Recent Payment Transactions" subtitle="Collections logged in current period">
          <div className="space-y-2 text-xs">
            {(data?.recentPayments || []).map((pay) => (
              <div
                key={pay.id}
                className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    ${Number(pay.amount).toLocaleString()} &bull; {pay.method}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Student: {pay.invoice?.student?.user?.name} &bull; Trx: {pay.transactionId || 'CASH'}
                  </p>
                </div>
                <span className="text-[10px] text-slate-400">
                  {new Date(pay.paymentDate).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </>
    );
  }

  if (role === 'LIBRARIAN') {
    return (
      <>
        <Card title="Recent Book Circulation" subtitle="Latest check-outs and returns">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700 text-slate-400">
                  <th className="py-2 px-3">Book Title</th>
                  <th className="py-2 px-3">Borrower</th>
                  <th className="py-2 px-3">Borrowed On</th>
                  <th className="py-2 px-3">Due Date</th>
                  <th className="py-2 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(data?.recentLoans || []).map((loan) => (
                  <tr key={loan.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                      {loan.book?.title}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                      {loan.user?.name}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">
                      {new Date(loan.borrowDate).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">
                      {new Date(loan.dueDate).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status={loan.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </>
    );
  }

  return null;
}
