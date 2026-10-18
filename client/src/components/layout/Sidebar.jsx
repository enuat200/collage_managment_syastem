import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  BookOpen,
  CalendarCheck,
  Award,
  CreditCard,
  Library,
  Megaphone,
  ShieldCheck,
  GraduationCap,
  X,
} from 'lucide-react';
import { COLLEGE_IMAGES } from '../../assets/collegeImages.js';

export const NAV_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    roles: ['SUPER_ADMIN', 'COLLEGE_ADMIN', 'REGISTRAR', 'TEACHER', 'STUDENT', 'ACCOUNTANT', 'LIBRARIAN'],
  },
  {
    id: 'students',
    label: 'Students',
    icon: Users,
    roles: ['SUPER_ADMIN', 'COLLEGE_ADMIN', 'REGISTRAR', 'TEACHER', 'ACCOUNTANT'],
  },
  {
    id: 'faculty',
    label: 'Faculty & Staff',
    icon: Briefcase,
    roles: ['SUPER_ADMIN', 'COLLEGE_ADMIN', 'REGISTRAR'],
  },
  {
    id: 'academics',
    label: 'Academics & Courses',
    icon: BookOpen,
    roles: ['SUPER_ADMIN', 'COLLEGE_ADMIN', 'REGISTRAR', 'TEACHER', 'STUDENT'],
  },
  {
    id: 'attendance',
    label: 'Attendance',
    icon: CalendarCheck,
    roles: ['SUPER_ADMIN', 'COLLEGE_ADMIN', 'REGISTRAR', 'TEACHER', 'STUDENT'],
  },
  {
    id: 'exams',
    label: 'Exams & Grades',
    icon: Award,
    roles: ['SUPER_ADMIN', 'COLLEGE_ADMIN', 'REGISTRAR', 'TEACHER', 'STUDENT'],
  },
  {
    id: 'finance',
    label: 'Finance & Invoices',
    icon: CreditCard,
    roles: ['SUPER_ADMIN', 'COLLEGE_ADMIN', 'ACCOUNTANT', 'STUDENT'],
  },
  {
    id: 'library',
    label: 'Library',
    icon: Library,
    roles: ['SUPER_ADMIN', 'COLLEGE_ADMIN', 'LIBRARIAN', 'STUDENT', 'TEACHER'],
  },
  {
    id: 'announcements',
    label: 'Announcements',
    icon: Megaphone,
    roles: ['SUPER_ADMIN', 'COLLEGE_ADMIN', 'REGISTRAR', 'TEACHER', 'STUDENT', 'ACCOUNTANT', 'LIBRARIAN'],
  },
  {
    id: 'admin',
    label: 'System & Audits',
    icon: ShieldCheck,
    roles: ['SUPER_ADMIN', 'COLLEGE_ADMIN'],
  },
];

export const Sidebar = ({ activeTab, onSelectTab, isOpen, onClose }) => {
  const { role } = useAuth();

  const allowedItems = NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar aside */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-200 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header inside mobile sidebar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between lg:hidden">
          <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">Navigation</span>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Main Menu
          </div>
          {allowedItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  if (onClose) onClose();
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition duration-150 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Footer info in sidebar with campus photo */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800/80">
          <div className="relative rounded-xl overflow-hidden p-3.5 text-xs text-white shadow-sm border border-indigo-400/20 group">
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
              style={{ backgroundImage: `url(${COLLEGE_IMAGES.campuses.clockTower})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-indigo-950/85 to-indigo-950/70" />
            <div className="relative z-10">
              <p className="font-bold text-white text-xs flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-amber-300" />
                UniManage University
              </p>
              <p className="text-slate-300 text-[10px] mt-0.5">Main Quad &bull; Term Fall 2026</p>
              <div className="mt-2 flex items-center gap-1.5 text-[10px] text-emerald-300 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Connected to Cloud DB
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
