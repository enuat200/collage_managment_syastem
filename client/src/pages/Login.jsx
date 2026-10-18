import React, { useState } from 'react';
import { useAuth, DEMO_USERS } from '../context/AuthContext.jsx';
import { Input, Button } from '../components/common/FormComponents.jsx';
import { RoleBadge } from '../components/common/Badge.jsx';
import { COLLEGE_IMAGES } from '../assets/collegeImages.js';
import {
  GraduationCap,
  AlertCircle,
  Sparkles,
  BookOpen,
  Award,
  Users,
  Compass,
  ArrowRight,
  ShieldCheck,
  Building2,
} from 'lucide-react';

export const Login = () => {
  const { login, quickLogin, loading } = useAuth();
  const [email, setEmail] = useState('superadmin@college.edu');
  const [password, setPassword] = useState('Admin@123');
  const [error, setError] = useState('');
  const [activeCampusBg, setActiveCampusBg] = useState(COLLEGE_IMAGES.campuses.historicQuad);

  const campusScenes = [
    { name: 'Main Campus Quad', url: COLLEGE_IMAGES.campuses.historicQuad },
    { name: 'Modern Atrium', url: COLLEGE_IMAGES.campuses.modernCampus },
    { name: 'Grand Library', url: COLLEGE_IMAGES.facilities.grandLibrary },
    { name: 'Commencement Hall', url: COLLEGE_IMAGES.campuses.graduationHall },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    }
  };

  const handleQuickLogin = async (roleKey) => {
    setError('');
    try {
      await quickLogin(roleKey);
    } catch (err) {
      setError(err.message || 'Quick login failed.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-950 font-sans">
      {/* Left Showcase Banner: Visual College Campus Showcase (hidden on mobile, prominent on lg) */}
      <div className="relative lg:w-7/12 min-h-[380px] lg:min-h-screen flex flex-col justify-between p-8 sm:p-12 text-white overflow-hidden">
        {/* Background Campus Photo with Smooth Transition */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-700 ease-in-out scale-105"
          style={{ backgroundImage: `url(${activeCampusBg})` }}
        />
        {/* Deep Multi-layer Gradient Overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-indigo-950/75 to-slate-950/80 backdrop-blur-[1px]" />
        
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

        {/* Top Header: University Crest & Identity */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 via-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/30 ring-2 ring-white/20">
              <GraduationCap className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-white drop-shadow-sm">
                  UniManage
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  University CMS
                </span>
              </div>
              <p className="text-xs text-indigo-200/80 tracking-wide font-medium">
                Institute of Higher Education & Research
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-indigo-200 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Academic Year 2026 – 2027</span>
          </div>
        </div>

        {/* Center / Hero Copy: College Vision & Metrics */}
        <div className="relative z-10 my-auto py-8 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-600/30 border border-indigo-400/30 text-indigo-200 text-xs font-semibold mb-4 backdrop-blur-sm">
            <Building2 className="w-3.5 h-3.5 text-indigo-300" />
            <span>Global Top 1% Ranked Institution</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight drop-shadow-md">
            Shaping the Future of <span className="bg-gradient-to-r from-amber-300 via-indigo-200 to-sky-300 bg-clip-text text-transparent">Higher Learning</span>
          </h1>

          <p className="mt-4 text-sm sm:text-base text-slate-200 leading-relaxed drop-shadow">
            Welcome to the centralized academic management portal. Manage student admissions, dynamic semester timetables, faculty research, examination marks, bursar ledgers, and digital library archives in one unified ecosystem.
          </p>

          {/* Institutional KPI Cards */}
          <div className="mt-8 grid grid-cols-3 gap-3 sm:gap-4">
            <div className="p-3.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15">
              <div className="flex items-center gap-2 text-amber-300 mb-1">
                <Users className="w-4 h-4" />
                <span className="text-lg font-bold text-white">12,500+</span>
              </div>
              <p className="text-[11px] text-slate-300 font-medium leading-tight">Enrolled Scholars</p>
            </div>

            <div className="p-3.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15">
              <div className="flex items-center gap-2 text-emerald-300 mb-1">
                <Award className="w-4 h-4" />
                <span className="text-lg font-bold text-white">98.4%</span>
              </div>
              <p className="text-[11px] text-slate-300 font-medium leading-tight">Graduation Rate</p>
            </div>

            <div className="p-3.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15">
              <div className="flex items-center gap-2 text-sky-300 mb-1">
                <BookOpen className="w-4 h-4" />
                <span className="text-lg font-bold text-white">45+</span>
              </div>
              <p className="text-[11px] text-slate-300 font-medium leading-tight">Degree Programs</p>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Interactive Campus Scene Switcher */}
        <div className="relative z-10 pt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-amber-300" />
            <span className="font-semibold text-slate-200">Campus View:</span>
            <div className="flex flex-wrap gap-1.5">
              {campusScenes.map((scene) => (
                <button
                  key={scene.name}
                  type="button"
                  onClick={() => setActiveCampusBg(scene.url)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
                    activeCampusBg === scene.url
                      ? 'bg-white text-slate-900 shadow-sm font-semibold'
                      : 'bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10'
                  }`}
                >
                  {scene.name}
                </button>
              ))}
            </div>
          </div>
          <span className="hidden sm:inline text-[11px] text-slate-400">
            Official Campus Gateway
          </span>
        </div>
      </div>

      {/* Right Form: Sleek & Clean Authentication Panel */}
      <div className="lg:w-5/12 bg-white dark:bg-slate-900 flex flex-col justify-center px-6 sm:px-12 py-10 sm:py-14 shadow-2xl relative z-20 border-l border-slate-200 dark:border-slate-800">
        <div className="max-w-md w-full mx-auto space-y-6">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              Role-Based Access Control
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Sign In to Your Portal
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Enter your institutional credentials or use the 1-click demo accounts below.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <p className="text-xs text-rose-700 dark:text-rose-300 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Institutional Email"
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@college.edu"
              required
            />

            <Input
              label="Security Password"
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <Button
              type="submit"
              loading={loading}
              className="w-full mt-2 shadow-md hover:shadow-lg transition-all"
              size="lg"
            >
              Access Portal
            </Button>
          </form>

          {/* Quick Demo Logins Section */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Instant Demo Role Switcher
              </span>
              <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                Password: <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">Admin@123</code>
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-1 select-none">
              {Object.entries(DEMO_USERS).map(([roleKey, info]) => (
                <button
                  key={roleKey}
                  type="button"
                  onClick={() => handleQuickLogin(roleKey)}
                  disabled={loading}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-indigo-50/60 dark:hover:bg-slate-800 transition text-left group"
                >
                  <div className="truncate pr-2">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate">
                      {info.roleName}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">{info.email}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <RoleBadge role={roleKey} />
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 text-center text-[11px] text-slate-400">
            UniManage Higher Education CMS &bull; Secure Academic Cloud System
          </div>
        </div>
      </div>
    </div>
  );
};
