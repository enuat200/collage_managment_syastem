import React, { useState } from 'react';
import { useAuth, DEMO_USERS } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { RoleBadge } from '../common/Badge.jsx';
import {
  Sun,
  Moon,
  Bell,
  LogOut,
  User,
  GraduationCap,
  ChevronDown,
  Menu,
} from 'lucide-react';

export const Navbar = ({ onToggleSidebar, notifications = [] }) => {
  const { user, role, quickLogin, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);

  const handleRoleSelect = async (roleKey) => {
    setShowRoleMenu(false);
    await quickLogin(roleKey);
  };

  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xs">
      <div className="px-4 sm:px-6 py-3 flex items-center justify-between">
        {/* Left: Mobile hamburger & branding */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Toggle Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-xs">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-base text-slate-900 dark:text-white leading-tight">
                UniManage <span className="text-indigo-600 dark:text-indigo-400 text-xs font-semibold px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 ml-1">CMS</span>
              </h1>
              <p className="text-[11px] text-slate-400 hidden sm:block">College Operations & Academic Portal</p>
            </div>
          </div>
        </div>

        {/* Right: Controls & Role Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Role Switcher Pill */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition"
              title="Test another role immediately"
            >
              <span className="hidden md:inline text-slate-400">Role:</span>
              <RoleBadge role={role} />
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
            </button>

            {showRoleMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowRoleMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-700 mb-1">
                    Quick Role Switcher (Demo)
                  </div>
                  {Object.entries(DEMO_USERS).map(([key, item]) => (
                    <button
                      key={key}
                      onClick={() => handleRoleSelect(key)}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/60 transition ${
                        role === key ? 'bg-indigo-50/70 dark:bg-indigo-950/40 font-semibold text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <span>{item.roleName}</span>
                      <RoleBadge role={key} />
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400 transition"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400 transition relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {notifications.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
              )}
            </button>

            {showNotifs && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowNotifs(false)}
                />
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-3 z-50">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200">
                    <span>Notifications</span>
                    <span className="text-[11px] text-slate-400">{notifications.length} Unread</span>
                  </div>
                  <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-4">No new notifications</p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 text-xs border border-slate-100 dark:border-slate-800"
                        >
                          <p className="font-medium text-slate-800 dark:text-slate-200">{n.title}</p>
                          <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* User Profile & Sign Out */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-semibold text-xs flex items-center justify-center">
              {user?.name ? user.name[0].toUpperCase() : <User className="w-4 h-4" />}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
                {user?.name}
              </p>
              <p className="text-[10px] text-slate-400 truncate max-w-[120px]">{user?.email}</p>
            </div>
            <button
              onClick={logout}
              className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition ml-1"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
