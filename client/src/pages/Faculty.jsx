import React, { useState, useEffect } from 'react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Table } from '../components/common/Table.jsx';
import { Modal, ConfirmDialog } from '../components/common/Modal.jsx';
import { Input, Select, Button } from '../components/common/FormComponents.jsx';
import { Card } from '../components/common/Card.jsx';
import { RoleBadge } from '../components/common/Badge.jsx';
import {
  UserCheck,
  Plus,
  BookOpen,
  Trash2,
  Mail,
  Phone,
  Briefcase,
  Award,
  Link,
  Sparkles,
} from 'lucide-react';
import { COLLEGE_IMAGES, getFacultyAvatar } from '../assets/collegeImages.js';

export const Faculty = () => {
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState('teachers'); // 'teachers' | 'staff'
  const [teachers, setTeachers] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [createTeacherModal, setCreateTeacherModal] = useState(false);
  const [assignCourseModal, setAssignCourseModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Forms
  const [teacherForm, setTeacherForm] = useState({
    name: '',
    email: '',
    employeeId: '',
    departmentId: '',
    designation: 'Professor',
    qualification: 'Ph.D. in Computer Science',
    specialization: 'Artificial Intelligence',
    phone: '',
    officeRoom: 'Tech Block 302',
  });

  const [assignForm, setAssignForm] = useState({
    teacherId: '',
    courseId: '',
    sectionId: '',
  });

  const canManage = ['SUPER_ADMIN', 'COLLEGE_ADMIN'].includes(role);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tRes, sRes, dRes, cRes, secRes] = await Promise.all([
        api.get('/teachers'),
        api.get('/staff').catch(() => []),
        api.get('/academics/departments'),
        api.get('/academics/courses'),
        api.get('/academics/sections').catch(() => []),
      ]);
      setTeachers(tRes || []);
      setStaffList(sRes || []);
      setDepartments(dRes || []);
      setCourses(cRes || []);
      setSections(secRes || []);
    } catch (err) {
      console.error('Error fetching faculty data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreateTeacher = () => {
    setTeacherForm({
      name: '',
      email: '',
      employeeId: `FAC-${Math.floor(100 + Math.random() * 900)}`,
      departmentId: departments[0]?.id ? String(departments[0].id) : '',
      designation: 'Associate Professor',
      qualification: 'Ph.D.',
      specialization: 'Software Engineering',
      phone: '',
      officeRoom: 'Building A, Room 101',
    });
    setCreateTeacherModal(true);
  };

  const handleCreateTeacher = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.post('/teachers', {
        ...teacherForm,
        departmentId: Number(teacherForm.departmentId),
      });
      setCreateTeacherModal(false);
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to add faculty member');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenAssign = (teacher) => {
    setSelectedTeacher(teacher);
    setAssignForm({
      teacherId: String(teacher.id),
      courseId: courses[0]?.id ? String(courses[0].id) : '',
      sectionId: sections[0]?.id ? String(sections[0].id) : '',
    });
    setAssignCourseModal(true);
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.post('/academics/assignments', {
        teacherId: Number(assignForm.teacherId),
        courseId: Number(assignForm.courseId),
        sectionId: assignForm.sectionId ? Number(assignForm.sectionId) : null,
      });
      setAssignCourseModal(false);
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to assign course');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveAssignment = async (assignmentId) => {
    if (!confirm('Remove this course assignment?')) return;
    try {
      await api.delete(`/academics/assignments/${assignmentId}`);
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to remove assignment');
    }
  };

  const teacherColumns = [
    {
      header: 'Faculty Scholar',
      key: 'user.name',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <img
            src={getFacultyAvatar(row.id || row.employeeId || row.user?.name)}
            alt={row.user?.name || 'Faculty'}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-500/20 shrink-0 shadow-xs"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = COLLEGE_IMAGES.facultyAvatars[0];
            }}
          />
          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-100">{row.user?.name}</p>
            <p className="text-xs text-slate-400 font-mono">ID: {row.employeeId}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Department',
      key: 'department.name',
      render: (_, row) => (
        <span className="font-medium text-slate-700 dark:text-slate-300">
          {row.department?.name || 'Unassigned'}
        </span>
      ),
    },
    {
      header: 'Designation & Spec',
      key: 'designation',
      render: (_, row) => (
        <div>
          <p className="text-slate-700 dark:text-slate-300 font-medium">{row.designation}</p>
          <p className="text-xs text-slate-400">{row.specialization || row.qualification}</p>
        </div>
      ),
    },
    {
      header: 'Contact Info',
      key: 'contact',
      render: (_, row) => (
        <div className="text-xs text-slate-500 space-y-0.5">
          <p className="flex items-center gap-1">
            <Mail className="w-3 h-3" /> {row.user?.email}
          </p>
          <p className="text-slate-400">Office: {row.officeRoom || 'TBD'}</p>
        </div>
      ),
    },
    {
      header: 'Assigned Courses',
      key: 'assignments',
      render: (_, row) => (
        <div className="space-y-1">
          {row.assignments && row.assignments.length > 0 ? (
            row.assignments.map((a) => (
              <span
                key={a.id}
                className="inline-flex items-center gap-1 mr-1 px-2 py-0.5 rounded text-[11px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-medium"
              >
                {a.course?.code}
                {canManage && (
                  <button
                    onClick={() => handleRemoveAssignment(a.id)}
                    className="text-indigo-400 hover:text-rose-600 ml-0.5"
                    title="Remove assignment"
                  >
                    &times;
                  </button>
                )}
              </span>
            ))
          ) : (
            <span className="text-xs text-slate-400 italic">None assigned</span>
          )}
        </div>
      ),
    },
    {
      header: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, row) =>
        canManage ? (
          <Button
            size="sm"
            variant="outline"
            icon={Link}
            onClick={() => handleOpenAssign(row)}
          >
            Assign Course
          </Button>
        ) : null,
    },
  ];

  const staffColumns = [
    {
      header: 'Staff Member',
      key: 'user.name',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <img
            src={getFacultyAvatar(row.id || row.employeeId || row.user?.name)}
            alt={row.user?.name || 'Staff'}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-500/20 shrink-0 shadow-xs"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = COLLEGE_IMAGES.facultyAvatars[0];
            }}
          />
          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-100">{row.user?.name}</p>
            <p className="text-xs text-slate-400 font-mono">ID: {row.employeeId}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Department',
      key: 'department',
      render: (_, row) => (
        <span className="text-slate-700 dark:text-slate-300">{row.department?.name || 'General Operations'}</span>
      ),
    },
    {
      header: 'Designation / Role',
      key: 'designation',
      render: (_, row) => (
        <div>
          <p className="font-medium text-slate-800 dark:text-slate-200">{row.designation}</p>
          <RoleBadge role={row.user?.role} />
        </div>
      ),
    },
    {
      header: 'Contact',
      key: 'user.email',
      render: (_, row) => (
        <div className="text-xs text-slate-500">
          <p>{row.user?.email}</p>
          <p>{row.user?.phone || 'No phone'}</p>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Visual Page Banner with University Faculty & Campus Imagery */}
      <div className="relative rounded-2xl overflow-hidden shadow-md text-white border border-indigo-400/20">
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
          style={{ backgroundImage: `url(${COLLEGE_IMAGES.campuses.historicQuad})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-indigo-950/85 to-indigo-900/70" />
        <div className="relative z-10 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                Academic Leadership
              </span>
              <span className="text-xs text-indigo-200">Professors, Scholars & Staff</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Faculty & Departmental Staff
            </h2>
            <p className="text-xs sm:text-sm text-indigo-100/90 mt-1 max-w-xl">
              Distinguished professors, research fellows, lab directors, and academic support staff steering higher education excellence.
            </p>
          </div>

          {canManage && (
            <Button
              icon={Plus}
              onClick={handleOpenCreateTeacher}
              className="bg-white text-slate-900 hover:bg-slate-100 shadow-md font-bold shrink-0 self-start sm:self-auto"
            >
              Add Faculty Member
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('teachers')}
          className={`py-2 px-4 text-sm font-medium border-b-2 transition ${
            activeTab === 'teachers'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Teaching Faculty ({teachers.length})
        </button>
        <button
          onClick={() => setActiveTab('staff')}
          className={`py-2 px-4 text-sm font-medium border-b-2 transition ${
            activeTab === 'staff'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Administrative Staff ({staffList.length})
        </button>
      </div>

      {/* Content Table */}
      {activeTab === 'teachers' ? (
        <Table
          columns={teacherColumns}
          data={teachers}
          loading={loading}
          searchPlaceholder="Search faculty by name, ID, or specialization..."
          emptyTitle="No faculty members found"
        />
      ) : (
        <Table
          columns={staffColumns}
          data={staffList}
          loading={loading}
          searchPlaceholder="Search staff by name or role..."
          emptyTitle="No staff records found"
        />
      )}

      {/* Add Faculty Modal */}
      <Modal
        isOpen={createTeacherModal}
        onClose={() => setCreateTeacherModal(false)}
        title="Register New Faculty Member"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreateTeacher} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              required
              value={teacherForm.name}
              onChange={(e) => setTeacherForm({ ...teacherForm, name: e.target.value })}
              placeholder="e.g. Dr. Alan Turing"
            />
            <Input
              label="Email Address"
              type="email"
              required
              value={teacherForm.email}
              onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })}
              placeholder="turing@college.edu"
            />
            <Input
              label="Employee ID"
              required
              value={teacherForm.employeeId}
              onChange={(e) => setTeacherForm({ ...teacherForm, employeeId: e.target.value })}
            />
            <Select
              label="Department"
              required
              value={teacherForm.departmentId}
              onChange={(e) => setTeacherForm({ ...teacherForm, departmentId: e.target.value })}
            >
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </Select>
            <Input
              label="Designation"
              required
              value={teacherForm.designation}
              onChange={(e) => setTeacherForm({ ...teacherForm, designation: e.target.value })}
              placeholder="e.g. Professor / Lecturer"
            />
            <Input
              label="Highest Qualification"
              value={teacherForm.qualification}
              onChange={(e) => setTeacherForm({ ...teacherForm, qualification: e.target.value })}
              placeholder="e.g. Ph.D. in CS"
            />
            <Input
              label="Specialization"
              value={teacherForm.specialization}
              onChange={(e) => setTeacherForm({ ...teacherForm, specialization: e.target.value })}
              placeholder="e.g. Machine Learning"
            />
            <Input
              label="Office / Room"
              value={teacherForm.officeRoom}
              onChange={(e) => setTeacherForm({ ...teacherForm, officeRoom: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
            <Button variant="secondary" onClick={() => setCreateTeacherModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={actionLoading}>
              Register Faculty
            </Button>
          </div>
        </form>
      </Modal>

      {/* Assign Course Modal */}
      <Modal
        isOpen={assignCourseModal}
        onClose={() => setAssignCourseModal(false)}
        title={`Assign Course to ${selectedTeacher?.user?.name || 'Faculty'}`}
      >
        <form onSubmit={handleAssignSubmit} className="space-y-4">
          <Select
            label="Course to Teach"
            required
            value={assignForm.courseId}
            onChange={(e) => setAssignForm({ ...assignForm, courseId: e.target.value })}
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} - {c.title} ({c.credits} Credits)
              </option>
            ))}
          </Select>

          {sections.length > 0 && (
            <Select
              label="Section (Optional)"
              value={assignForm.sectionId}
              onChange={(e) => setAssignForm({ ...assignForm, sectionId: e.target.value })}
            >
              <option value="">All Sections</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
            <Button variant="secondary" onClick={() => setAssignCourseModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={actionLoading}>
              Confirm Course Assignment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
