import React, { useState, useEffect } from 'react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Table } from '../components/common/Table.jsx';
import { Modal, ConfirmDialog } from '../components/common/Modal.jsx';
import { Input, Select, Button } from '../components/common/FormComponents.jsx';
import { StatusBadge } from '../components/common/Badge.jsx';
import { Card } from '../components/common/Card.jsx';
import {
  UserPlus,
  Eye,
  Edit2,
  Trash2,
  Download,
  Filter,
  GraduationCap,
  Mail,
  Phone,
  Calendar,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { COLLEGE_IMAGES, getStudentAvatar } from '../assets/collegeImages.js';

export const Students = ({ onViewTranscript }) => {
  const { role } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState([]);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    rollNo: '',
    departmentId: '',
    programId: '',
    semester: '1',
    phone: '',
    enrollmentStatus: 'ACTIVE',
  });

  const canManage = ['SUPER_ADMIN', 'COLLEGE_ADMIN', 'REGISTRAR'].includes(role);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params = {
        search,
        page,
        limit: 10,
      };
      if (deptFilter) params.departmentId = deptFilter;
      if (statusFilter) params.status = statusFilter;

      const res = await api.get('/students', params);
      setStudents(res.data || []);
      setTotalPages(res.pagination?.totalPages || 1);
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMeta = async () => {
    try {
      const [deptRes, progRes] = await Promise.all([
        api.get('/academics/departments'),
        api.get('/academics/programs'),
      ]);
      setDepartments(deptRes || []);
      setPrograms(progRes || []);
    } catch (err) {
      console.error('Error fetching metadata:', err);
    }
  };

  useEffect(() => {
    fetchMeta();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [search, deptFilter, statusFilter, page]);

  const handleOpenCreate = () => {
    setFormData({
      name: '',
      email: '',
      rollNo: `STU-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      departmentId: departments[0]?.id ? String(departments[0].id) : '',
      programId: programs[0]?.id ? String(programs[0].id) : '',
      semester: '1',
      phone: '',
      enrollmentStatus: 'ACTIVE',
    });
    setCreateModalOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.post('/students', {
        ...formData,
        departmentId: Number(formData.departmentId),
        programId: Number(formData.programId),
        semester: Number(formData.semester),
      });
      setCreateModalOpen(false);
      fetchStudents();
    } catch (err) {
      alert(err.message || 'Failed to create student');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewDetails = async (student) => {
    try {
      const detailed = await api.get(`/students/${student.id}`);
      setSelectedStudent(detailed);
      setDetailsModalOpen(true);
    } catch (err) {
      alert('Error fetching student details');
    }
  };

  const handleOpenEdit = (student) => {
    setSelectedStudent(student);
    setFormData({
      name: student.user?.name || '',
      email: student.user?.email || '',
      rollNo: student.rollNo,
      departmentId: String(student.department?.id || ''),
      programId: String(student.program?.id || ''),
      semester: String(student.semester || 1),
      phone: student.user?.phone || '',
      enrollmentStatus: student.enrollmentStatus || 'ACTIVE',
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.put(`/students/${selectedStudent.id}`, {
        ...formData,
        departmentId: Number(formData.departmentId),
        programId: Number(formData.programId),
        semester: Number(formData.semester),
      });
      setEditModalOpen(false);
      fetchStudents();
    } catch (err) {
      alert(err.message || 'Failed to update student');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await api.delete(`/students/${selectedStudent.id}`);
      setDeleteDialogOpen(false);
      fetchStudents();
    } catch (err) {
      alert(err.message || 'Failed to delete student');
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      header: 'Roll No',
      key: 'rollNo',
      render: (val) => <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">{val}</span>,
    },
    {
      header: 'Student Scholar',
      key: 'user.name',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <img
            src={getStudentAvatar(row.id || row.rollNo || row.user?.name)}
            alt={row.user?.name || 'Student'}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-500/20 shrink-0 shadow-xs"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = COLLEGE_IMAGES.avatars[0];
            }}
          />
          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-100">{row.user?.name}</p>
            <p className="text-xs text-slate-400">{row.user?.email}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Department & Program',
      key: 'department',
      render: (_, row) => (
        <div>
          <span className="font-medium text-slate-700 dark:text-slate-300">{row.department?.code}</span>
          <p className="text-xs text-slate-400">{row.program?.name || 'General'}</p>
        </div>
      ),
    },
    {
      header: 'Semester',
      key: 'semester',
      render: (sem) => <span className="text-slate-600 dark:text-slate-400">Sem {sem}</span>,
    },
    {
      header: 'Status',
      key: 'enrollmentStatus',
      render: (st) => <StatusBadge status={st} />,
    },
    {
      header: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, row) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => handleViewDetails(row)}
            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          {canManage && (
            <>
              <button
                onClick={() => handleOpenEdit(row)}
                className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition"
                title="Edit Student"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setSelectedStudent(row);
                  setDeleteDialogOpen(true);
                }}
                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition"
                title="Delete Student"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Visual Page Banner with University Student Imagery */}
      <div className="relative rounded-2xl overflow-hidden shadow-md text-white border border-indigo-400/20">
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
          style={{ backgroundImage: `url(${COLLEGE_IMAGES.students.studyingTogether})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-indigo-950/85 to-indigo-900/70" />
        <div className="relative z-10 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                Undergraduate & Postgraduate
              </span>
              <span className="text-xs text-indigo-200">Admissions & Records</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Student Body & Enrollment Directory
            </h2>
            <p className="text-xs sm:text-sm text-indigo-100/90 mt-1 max-w-xl">
              Track student cohorts across academic departments, monitor semester progression, and issue certified official transcripts.
            </p>
          </div>
          {canManage && (
            <Button
              icon={UserPlus}
              onClick={handleOpenCreate}
              className="bg-white text-slate-900 hover:bg-slate-100 shadow-md font-bold shrink-0 self-start sm:self-auto"
            >
              Admit New Student
            </Button>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            placeholder="Search by name, roll no, email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <Select
            value={deptFilter}
            onChange={(e) => {
              setDeptFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.code})
              </option>
            ))}
          </Select>
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Enrollment Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="PROBATION">PROBATION</option>
            <option value="SUSPENDED">SUSPENDED</option>
            <option value="GRADUATED">GRADUATED</option>
          </Select>
        </div>
      </Card>

      {/* Students Data Table */}
      <Table
        columns={columns}
        data={students}
        loading={loading}
        searchable={false}
        emptyTitle="No students found"
        emptyDescription="Try adjusting your search query or department filters."
      />

      {/* Create Student Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Admit New Student"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. John Doe"
            />
            <Input
              label="Email Address"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="e.g. jdoe@college.edu"
            />
            <Input
              label="Roll Number / Student ID"
              required
              value={formData.rollNo}
              onChange={(e) => setFormData({ ...formData, rollNo: e.target.value })}
            />
            <Input
              label="Contact Phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1-555-0100"
            />
            <Select
              label="Department"
              required
              value={formData.departmentId}
              onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
            >
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </Select>
            <Select
              label="Degree Program"
              required
              value={formData.programId}
              onChange={(e) => setFormData({ ...formData, programId: e.target.value })}
            >
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
            <Select
              label="Current Semester"
              value={formData.semester}
              onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <option key={s} value={s}>
                  Semester {s}
                </option>
              ))}
            </Select>
            <Select
              label="Enrollment Status"
              value={formData.enrollmentStatus}
              onChange={(e) => setFormData({ ...formData, enrollmentStatus: e.target.value })}
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="PROBATION">PROBATION</option>
              <option value="SUSPENDED">SUSPENDED</option>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
            <Button variant="secondary" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={actionLoading}>
              Confirm Admission
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Student Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Update Student Profile"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <Input
            label="Full Name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <Input
            label="Email Address"
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Department"
              value={formData.departmentId}
              onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
            >
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
            <Select
              label="Status"
              value={formData.enrollmentStatus}
              onChange={(e) => setFormData({ ...formData, enrollmentStatus: e.target.value })}
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="PROBATION">PROBATION</option>
              <option value="SUSPENDED">SUSPENDED</option>
              <option value="GRADUATED">GRADUATED</option>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
            <Button variant="secondary" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={actionLoading}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Student Details View Modal */}
      <Modal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        title={`Student Profile: ${selectedStudent?.user?.name || ''}`}
        maxWidth="max-w-3xl"
      >
        {selectedStudent && (
          <div className="space-y-6">
            {/* Header profile summary */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 gap-4">
              <div className="flex items-center gap-4">
                <img
                  src={getStudentAvatar(selectedStudent.id || selectedStudent.rollNo)}
                  alt={selectedStudent.user?.name}
                  className="w-16 h-16 rounded-2xl object-cover ring-2 ring-indigo-500/30 shadow-md shrink-0"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = COLLEGE_IMAGES.avatars[0];
                  }}
                />
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                    {selectedStudent.user?.name}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    Roll No: {selectedStudent.rollNo} &bull; {selectedStudent.department?.name}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5" /> {selectedStudent.user?.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" /> {selectedStudent.user?.phone || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                <StatusBadge status={selectedStudent.enrollmentStatus} />
                <button
                  onClick={() => {
                    setDetailsModalOpen(false);
                    if (onViewTranscript) onViewTranscript(selectedStudent.id);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
                >
                  <GraduationCap className="w-4 h-4" /> Academic Transcript
                </button>
              </div>
            </div>

            {/* Enrolled Courses */}
            <div>
              <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">
                Enrolled Courses ({selectedStudent.enrollments?.length || 0})
              </h4>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
                {(selectedStudent.enrollments || []).map((enr) => (
                  <div
                    key={enr.id}
                    className="p-3 bg-white dark:bg-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                        {enr.course?.code}
                      </span>{' '}
                      - {enr.course?.title}
                      <p className="text-[11px] text-slate-400">
                        {enr.course?.credits} Credits &bull; Section: {enr.section?.name || 'General'}
                      </p>
                    </div>
                    <span className="font-medium text-slate-600 dark:text-slate-300">{enr.status}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Ledger Summary */}
            <div>
              <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">
                Financial Invoices & Billing
              </h4>
              <div className="space-y-2 text-xs">
                {(selectedStudent.invoices || []).map((inv) => (
                  <div
                    key={inv.id}
                    className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-mono font-medium text-slate-800 dark:text-slate-200">
                        {inv.invoiceNumber}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Total: ${inv.totalAmount} | Paid: ${inv.paidAmount} | Balance: ${inv.balance}
                      </p>
                    </div>
                    <StatusBadge status={inv.status} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Student Record"
        message={`Are you sure you want to delete ${selectedStudent?.user?.name} (${selectedStudent?.rollNo})? All associated records will be removed.`}
        loading={actionLoading}
      />
    </div>
  );
};
