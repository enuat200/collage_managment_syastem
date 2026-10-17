import React, { useState } from 'react';
import { useAuth, DEMO_USERS } from '../context/AuthContext.jsx';
import { Input, Button } from '../components/common/FormComponents.jsx';
import { RoleBadge } from '../components/common/Badge.jsx';
import { GraduationCap, ShieldCheck, Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';

export const Login = () => {
  const { login, quickLogin, loading } = useAuth();
  const [email, setEmail] = useState('superadmin@college.edu');
  const [password, setPassword] = useState('Admin@123');
  const [error, setError] = useState('');

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-500 mx-auto flex items-center justify-center text-white shadow-xl shadow-indigo-500/20 mb-4">
          <GraduationCap className="w-9 h-9" />
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          UniManage <span className="text-indigo-400">CMS</span>
        </h2>
        <p className="mt-2 text-sm text-slate-300">
          Integrated Higher Education Management & Academic Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl px-4 sm:px-0">
        <div className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-md py-8 px-6 sm:px-10 shadow-2xl rounded-2xl border border-white/20 dark:border-slate-800">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <p className="text-sm text-rose-700 dark:text-rose-300">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@college.edu"
              required
            />

            <Input
              label="Password"
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
              className="w-full mt-2"
              size="lg"
            >
              Sign In to Portal
            </Button>
          </form>

          {/* Quick Demo Logins Section */}
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Demo Accounts (Click to test any role)
              </span>
              <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                Password: Admin@123
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
              {Object.entries(DEMO_USERS).map(([roleKey, info]) => (
                <button
                  key={roleKey}
                  type="button"
                  onClick={() => handleQuickLogin(roleKey)}
                  disabled={loading}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-indigo-50/50 dark:hover:bg-slate-800 transition text-left group"
                >
                  <div className="truncate pr-2">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate">
                      {info.roleName}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">{info.email}</p>
                  </div>
                  <RoleBadge role={roleKey} />
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-slate-400">
          UniManage College Management System &copy; 2026. All rights reserved.
        </p>
      </div>
    </div>
  );
};
