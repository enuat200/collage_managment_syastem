import React from 'react';

export const Badge = ({ children, variant = 'default', size = 'md' }) => {
  const variants = {
    default: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
    primary: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300',
    success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
    warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
    danger: 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300',
    info: 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300',
    purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs font-semibold',
    lg: 'px-3 py-1.5 text-sm font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${variants[variant] || variants.default} ${
        sizes[size] || sizes.md
      }`}
    >
      {children}
    </span>
  );
};

export const RoleBadge = ({ role }) => {
  switch (role) {
    case 'SUPER_ADMIN':
      return <Badge variant="purple">Super Admin</Badge>;
    case 'COLLEGE_ADMIN':
      return <Badge variant="primary">College Admin</Badge>;
    case 'REGISTRAR':
      return <Badge variant="info">Registrar</Badge>;
    case 'TEACHER':
      return <Badge variant="success">Teacher</Badge>;
    case 'STUDENT':
      return <Badge variant="default">Student</Badge>;
    case 'ACCOUNTANT':
      return <Badge variant="warning">Accountant</Badge>;
    case 'LIBRARIAN':
      return <Badge variant="info">Librarian</Badge>;
    default:
      return <Badge>{role}</Badge>;
  }
};

export const StatusBadge = ({ status }) => {
  const norm = String(status).toUpperCase();
  switch (norm) {
    case 'ACTIVE':
    case 'PRESENT':
    case 'PAID':
    case 'COMPLETED':
    case 'AVAILABLE':
      return <Badge variant="success">{status}</Badge>;
    case 'PARTIALLY_PAID':
    case 'LATE':
    case 'BORROWED':
    case 'PROBATION':
      return <Badge variant="warning">{status}</Badge>;
    case 'ABSENT':
    case 'OVERDUE':
    case 'FAILED':
    case 'UNPAID':
    case 'SUSPENDED':
      return <Badge variant="danger">{status}</Badge>;
    case 'EXCUSED':
    case 'RETURNED':
    case 'GRADUATED':
      return <Badge variant="info">{status}</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};
