import React, { useState, useEffect } from 'react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Table } from '../components/common/Table.jsx';
import { Modal } from '../components/common/Modal.jsx';
import { Input, Select, Button } from '../components/common/FormComponents.jsx';
import { Card } from '../components/common/Card.jsx';
import { RoleBadge } from '../components/common/Badge.jsx';
import {
  ShieldCheck,
  UserCheck,
  History,
  Sliders,
  CheckCircle,
  XCircle,
  Eye,
  Lock,
} from 'lucide-react';

export const AdminSettings = () => {
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'audits' | 'grades'
  const [loading, setLoading] = useState(true);

  // Data
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [gradeScales, setGradeScales] = useState([]);

  // Audit detail modal
  const [selectedAudit, setSelectedAudit] = useState(null);
  const [auditModalOpen, setAuditModalOpen] = useState(false);

  // Grade edit modal
  const [editGradeModal, setEditGradeModal] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [gradeForm, setGradeForm] = useState({ minScore: 0, maxScore: 100, gpaPoint: 4.0 });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [uRes, aRes, gRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/audit-logs'),
        api.get('/admin/grade-scales').catch(() => []),
      ]);
      setUsers(uRes || []);
      setAuditLogs(aRes || []);
      setGradeScales(gRes || []);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleToggleUserStatus = async (targetUser) => {
    const nextStatus = !targetUser.isActive;
    if (!confirm(`Are you sure you want to ${nextStatus ? 'ACTIVATE' : 'DEACTIVATE'} ${targetUser.name}?`)) return;

    try {
      await api.put(`/admin/users/${targetUser.id}/status`, { isActive: nextStatus });
      fetchAdminData();
    } catch (err) {
      alert(err.message || 'Failed to update user status');
    }
  };

  const handleOpenEditGrade = (scale) => {
    setSelectedGrade(scale);
    setGradeForm({
      minScore: scale.minScore,
      maxScore: scale.maxScore,
      gpaPoint: scale.gpaPoint,
    });
    setEditGradeModal(true);
  };

  const handleUpdateGradeScale = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.put(`/admin/grade-scales/${selectedGrade.id}`, {
        minScore: Number(gradeForm.minScore),
        maxScore: Number(gradeForm.maxScore),
        gpaPoint: Number(gradeForm.gpaPoint),
      });
      setEditGradeModal(false);
      fetchAdminData();
    } catch (err) {
      alert(err.message || 'Failed to update grade scale');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">System Governance & Audits</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          User account access control, security audit logs, and academic grade policy
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 py-2.5 px-4 text-xs font-semibold border-b-2 transition ${
            activeTab === 'users'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          User Accounts ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('audits')}
          className={`flex items-center gap-2 py-2.5 px-4 text-xs font-semibold border-b-2 transition ${
            activeTab === 'audits'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <History className="w-4 h-4" />
          Audit Logs ({auditLogs.length})
        </button>
        <button
          onClick={() => setActiveTab('grades')}
          className={`flex items-center gap-2 py-2.5 px-4 text-xs font-semibold border-b-2 transition ${
            activeTab === 'grades'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Grading Scale Matrix
        </button>
      </div>

      {/* Tab: Users */}
      {activeTab === 'users' && (
        <Table
          columns={[
            {
              header: 'User Name',
              key: 'name',
              render: (name, row) => (
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-100">{name}</p>
                  <p className="text-xs text-slate-400">{row.email}</p>
                </div>
              ),
            },
            {
              header: 'Assigned Role',
              key: 'role',
              render: (r) => <RoleBadge role={r} />,
            },
            {
              header: 'Account Status',
              key: 'isActive',
              render: (active) => (
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    active
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  }`}
                >
                  {active ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  {active ? 'ACTIVE' : 'DISABLED'}
                </span>
              ),
            },
            {
              header: 'Created On',
              key: 'createdAt',
              render: (d) => <span className="text-xs text-slate-500">{new Date(d).toLocaleDateString()}</span>,
            },
            {
              header: 'Status Action',
              key: 'actions',
              align: 'right',
              render: (_, row) => (
                <button
                  onClick={() => handleToggleUserStatus(row)}
                  className={`text-xs font-medium px-2.5 py-1 rounded-lg transition ${
                    row.isActive
                      ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                      : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                  }`}
                >
                  {row.isActive ? 'Deactivate' : 'Activate'}
                </button>
              ),
            },
          ]}
          data={users}
          loading={loading}
          searchPlaceholder="Search users by name or email..."
        />
      )}

      {/* Tab: Audit Logs */}
      {activeTab === 'audits' && (
        <Table
          columns={[
            {
              header: 'Timestamp',
              key: 'createdAt',
              render: (d) => (
                <span className="font-mono text-xs text-slate-500">
                  {new Date(d).toLocaleString()}
                </span>
              ),
            },
            {
              header: 'Actor',
              key: 'user.name',
              render: (_, row) => (
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{row.user?.name}</p>
                  <p className="text-[11px] text-slate-400">{row.user?.role}</p>
                </div>
              ),
            },
            {
              header: 'Action Performed',
              key: 'action',
              render: (action) => (
                <span className="font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded">
                  {action}
                </span>
              ),
            },
            {
              header: 'Entity Impacted',
              key: 'entity',
              render: (_, row) => (
                <span className="text-xs text-slate-600 dark:text-slate-300">
                  {row.entity} #{row.entityId}
                </span>
              ),
            },
            {
              header: 'Details',
              key: 'view',
              align: 'right',
              render: (_, row) => (
                <button
                  onClick={() => {
                    setSelectedAudit(row);
                    setAuditModalOpen(true);
                  }}
                  className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"
                  title="Inspect payload"
                >
                  <Eye className="w-4 h-4" />
                </button>
              ),
            },
          ]}
          data={auditLogs}
          loading={loading}
          searchPlaceholder="Search audit trails..."
        />
      )}

      {/* Tab: Grading Scale Matrix */}
      {activeTab === 'grades' && (
        <Card title="University Grading Policy" subtitle="Configured letter grades and GPA quality points">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 font-semibold">
                  <th className="py-2.5 px-3">Letter Grade</th>
                  <th className="py-2.5 px-3">Min Score (%)</th>
                  <th className="py-2.5 px-3">Max Score (%)</th>
                  <th className="py-2.5 px-3">GPA Quality Point</th>
                  <th className="py-2.5 px-3 text-right">Edit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {gradeScales.map((scale) => (
                  <tr key={scale.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-bold text-base text-indigo-600 dark:text-indigo-400 font-mono">
                      {scale.letterGrade}
                    </td>
                    <td className="py-2.5 px-3 font-mono">{scale.minScore}%</td>
                    <td className="py-2.5 px-3 font-mono">{scale.maxScore}%</td>
                    <td className="py-2.5 px-3 font-bold font-mono text-emerald-600">{scale.gpaPoint}</td>
                    <td className="py-2.5 px-3 text-right">
                      <Button size="sm" variant="ghost" onClick={() => handleOpenEditGrade(scale)}>
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modal: View Audit Details */}
      <Modal
        isOpen={auditModalOpen}
        onClose={() => setAuditModalOpen(false)}
        title={`Audit Record: ${selectedAudit?.action}`}
      >
        {selectedAudit && (
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg space-y-1">
              <p>
                <strong>Actor:</strong> {selectedAudit.user?.name} ({selectedAudit.user?.email})
              </p>
              <p>
                <strong>Entity:</strong> {selectedAudit.entity} #{selectedAudit.entityId}
              </p>
              <p>
                <strong>Timestamp:</strong> {new Date(selectedAudit.createdAt).toLocaleString()}
              </p>
              <p>
                <strong>IP Address:</strong> {selectedAudit.ipAddress || '127.0.0.1'}
              </p>
            </div>

            <div>
              <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1">Audit Details / Payload:</p>
              <pre className="p-3 rounded-lg bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto max-h-60">
                {JSON.stringify(selectedAudit.details || {}, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Edit Grade Scale */}
      <Modal
        isOpen={editGradeModal}
        onClose={() => setEditGradeModal(false)}
        title={`Edit Grade Scale: ${selectedGrade?.letterGrade}`}
      >
        <form onSubmit={handleUpdateGradeScale} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Min Score (%)"
              type="number"
              required
              value={gradeForm.minScore}
              onChange={(e) => setGradeForm({ ...gradeForm, minScore: e.target.value })}
            />
            <Input
              label="Max Score (%)"
              type="number"
              required
              value={gradeForm.maxScore}
              onChange={(e) => setGradeForm({ ...gradeForm, maxScore: e.target.value })}
            />
          </div>

          <Input
            label="GPA Points (out of 4.0)"
            type="number"
            step="0.05"
            required
            value={gradeForm.gpaPoint}
            onChange={(e) => setGradeForm({ ...gradeForm, gpaPoint: e.target.value })}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
            <Button variant="secondary" onClick={() => setEditGradeModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={actionLoading}>
              Save Grade Policy
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
