import React from 'react';

export const Card = ({ children, className = '', title, subtitle, headerAction }) => {
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden ${className}`}>
      {(title || subtitle || headerAction) && (
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
          <div>
            {title && <h3 className="font-semibold text-slate-800 dark:text-slate-100">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
};

export const StatCard = ({ title, value, icon: Icon, change, trend = 'up', color = 'indigo' }) => {
  const colorMap = {
    indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400',
    sky: 'bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400',
    rose: 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400',
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm hover:shadow transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</p>
          <h4 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{value}</h4>
        </div>
        {Icon && (
          <div className={`p-3 rounded-lg ${colorMap[color] || colorMap.indigo}`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
      {change && (
        <div className="mt-3 flex items-center text-xs">
          <span className={trend === 'up' ? 'text-emerald-600 font-semibold' : 'text-rose-600 font-semibold'}>
            {trend === 'up' ? '↑' : '↓'} {change}
          </span>
          <span className="text-slate-400 ml-1.5">vs previous term</span>
        </div>
      )}
    </div>
  );
};
