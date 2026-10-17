import React, { useState, useEffect } from 'react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Table } from '../components/common/Table.jsx';
import { Modal, ConfirmDialog } from '../components/common/Modal.jsx';
import { Input, Select, Textarea, Button } from '../components/common/FormComponents.jsx';
import { Card } from '../components/common/Card.jsx';
import {
  Building2,
  GraduationCap,
  BookOpen,
  Calendar,
  Clock,
  Plus,
  Trash2,
  AlertCircle,
  MapPin,
} from 'lucide-react';

export const Academics = () => {
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState('courses'); // 'departments' | 'programs' | 'courses' | 'semesters' | 'timetables'
  const [loading, setLoading] = useState(true);

  // Data states
  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [courses, setCourses] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [timetables, setTimetables] = useState([]);
  const [teachers, setTeachers] = useState([]);

  // Modals
  const [modalType, setModalType] = useState(null); // 'dept' | 'prog' | 'course' | 'sem' | 'slot'
  const [actionLoading, setActionLoading] = useState(false);
  const [conflictError, setConflictError] = useState('');

  // Form states
  const [deptForm, setDeptForm] = useState({ name: '', code: '', description: '' });
  const [progForm, setProgForm] = useState({ name: '', code: '', departmentId: '', durationYears: 4, degreeType: 'BACHELOR' });
  const [courseForm, setCourseForm] = useState({ code: '', title: '', credits: 3, departmentId: '', description: '' });
  const [semForm, setSemForm] = useState({ name: 'Fall 2026', startDate: '2026-09-01', endDate: '2027-01-15' });
  const [slotForm, setSlotForm] = useState({
    courseId: '',
    day: 'Monday',
    startTime: '09:00',
    endTime: '10:30',
    room: 'Hall 101',
  });

  const canManage = ['SUPER_ADMIN', 'COLLEGE_ADMIN', 'REGISTRAR'].includes(role);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [dRes, pRes, cRes, sRes, tRes, teachRes] = await Promise.all([
        api.get('/academics/departments'),
        api.get('/academics/programs'),
        api.get('/academics/courses'),
        api.get('/academics/semesters').catch(() => []),
        api.get('/academics/timetables').catch(() => []),
        api.get('/teachers').catch(() => []),
      ]);
      setDepartments(dRes || []);
      setPrograms(pRes || []);
      setCourses(cRes || []);
      setSemesters(sRes || []);
      setTimetables(tRes || []);
      setTeachers(teachRes || []);
    } catch (err) {
      console.error('Error fetching academic data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // Creation Handlers
  const handleCreateDept = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.post('/academics/departments', deptForm);
      setModalType(null);
      fetchAll();
    } catch (err) {
      alert(err.message || 'Failed to create department');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateProg = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.post('/academics/programs', {
        ...progForm,
        departmentId: Number(progForm.departmentId),
        durationYears: Number(progForm.durationYears),
      });
      setModalType(null);
      fetchAll();
    } catch (err) {
      alert(err.message || 'Failed to create program');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.post('/academics/courses', {
        ...courseForm,
        credits: Number(courseForm.credits),
        departmentId: Number(courseForm.departmentId),
      });
      setModalType(null);
      fetchAll();
    } catch (err) {
      alert(err.message || 'Failed to create course');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateSem = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.post('/academics/semesters', semForm);
      setModalType(null);
      fetchAll();
    } catch (err) {
      alert(err.message || 'Failed to create semester');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateSlot = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setConflictError('');
    try {
      await api.post('/academics/timetables', {
        ...slotForm,
        courseId: Number(slotForm.courseId),
      });
      setModalType(null);
      fetchAll();
    } catch (err) {
      setConflictError(err.message || 'Scheduling conflict detected! Room or time overlaps with another booking.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSlot = async (id) => {
    if (!confirm('Remove this timetable slot?')) return;
    try {
      await api.delete(`/academics/timetables/${id}`);
      fetchAll();
    } catch (err) {
      alert(err.message || 'Failed to delete slot');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Academics & Curriculum</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Departments, Degree Programs, Courses, and Timetables
          </p>
        </div>

        {canManage && (
          <div className="flex items-center gap-2">
            {activeTab === 'departments' && (
              <Button icon={Plus} onClick={() => setModalType('dept')}>
                Add Department
              </Button>
            )}
            {activeTab === 'programs' && (
              <Button
                icon={Plus}
                onClick={() => {
                  setProgForm({
                    name: '',
                    code: '',
                    departmentId: departments[0]?.id ? String(departments[0].id) : '',
                    durationYears: 4,
                    degreeType: 'BACHELOR',
                  });
                  setModalType('prog');
                }}
              >
                Add Program
              </Button>
            )}
            {activeTab === 'courses' && (
              <Button
                icon={Plus}
                onClick={() => {
                  setCourseForm({
                    code: '',
                    title: '',
                    credits: 3,
                    departmentId: departments[0]?.id ? String(departments[0].id) : '',
                    description: '',
                  });
                  setModalType('course');
                }}
              >
                Add Course
              </Button>
            )}
            {activeTab === 'timetables' && (
              <Button
                icon={Plus}
                onClick={() => {
                  setSlotForm({
                    courseId: courses[0]?.id ? String(courses[0].id) : '',
                    day: 'Monday',
                    startTime: '09:00',
                    endTime: '10:30',
                    room: 'Hall 101',
                  });
                  setConflictError('');
                  setModalType('slot');
                }}
              >
                Schedule Class Slot
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-slate-200 dark:border-slate-800 space-x-2">
        {[
          { id: 'courses', label: `Courses (${courses.length})`, icon: BookOpen },
          { id: 'departments', label: `Departments (${departments.length})`, icon: Building2 },
          { id: 'programs', label: `Programs (${programs.length})`, icon: GraduationCap },
          { id: 'timetables', label: `Class Timetables (${timetables.length})`, icon: Clock },
          { id: 'semesters', label: `Semesters (${semesters.length})`, icon: Calendar },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-2.5 px-4 text-xs font-semibold border-b-2 whitespace-nowrap transition ${
                isActive
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      {activeTab === 'courses' && (
        <Table
          columns={[
            {
              header: 'Course Code',
              key: 'code',
              render: (code) => <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{code}</span>,
            },
            {
              header: 'Course Title',
              key: 'title',
              render: (_, row) => (
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{row.title}</p>
                  <p className="text-xs text-slate-400">{row.description || 'Core Curriculum'}</p>
                </div>
              ),
            },
            {
              header: 'Department',
              key: 'department.name',
              render: (_, row) => <span>{row.department?.name}</span>,
            },
            {
              header: 'Credits',
              key: 'credits',
              render: (cr) => (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                  {cr} Credits
                </span>
              ),
            },
          ]}
          data={courses}
          loading={loading}
          searchPlaceholder="Search courses by code or title..."
        />
      )}

      {activeTab === 'departments' && (
        <Table
          columns={[
            {
              header: 'Code',
              key: 'code',
              render: (code) => <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{code}</span>,
            },
            {
              header: 'Department Name',
              key: 'name',
              render: (name) => <span className="font-semibold text-indigo-600 dark:text-indigo-400">{name}</span>,
            },
            {
              header: 'Description',
              key: 'description',
              render: (desc) => <span className="text-xs text-slate-500">{desc || 'Academic Department'}</span>,
            },
          ]}
          data={departments}
          loading={loading}
          searchPlaceholder="Search departments..."
        />
      )}

      {activeTab === 'programs' && (
        <Table
          columns={[
            {
              header: 'Program Code',
              key: 'code',
              render: (code) => <span className="font-mono font-bold">{code}</span>,
            },
            {
              header: 'Degree Program',
              key: 'name',
              render: (name) => <span className="font-semibold text-slate-800 dark:text-slate-200">{name}</span>,
            },
            {
              header: 'Department',
              key: 'department.name',
              render: (_, row) => <span>{row.department?.name}</span>,
            },
            {
              header: 'Duration',
              key: 'durationYears',
              render: (yr) => <span>{yr} Years</span>,
            },
          ]}
          data={programs}
          loading={loading}
          searchPlaceholder="Search degree programs..."
        />
      )}

      {activeTab === 'timetables' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 text-xs text-indigo-800 dark:text-indigo-300 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              Automated Classroom Conflict Detector is active: prevents overlapping room schedules.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {timetables.map((slot) => (
              <div
                key={slot.id}
                className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-xs relative"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-indigo-600 dark:text-indigo-400">{slot.day}</span>
                  <span className="text-xs font-mono bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300">
                    {slot.startTime} - {slot.endTime}
                  </span>
                </div>
                <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
                  {slot.course?.code}: {slot.course?.title}
                </h4>
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1 font-mono">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> {slot.room}
                  </span>
                  {canManage && (
                    <button
                      onClick={() => handleDeleteSlot(slot.id)}
                      className="text-rose-500 hover:text-rose-700 p-1"
                      title="Delete slot"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'semesters' && (
        <Table
          columns={[
            {
              header: 'Semester Name',
              key: 'name',
              render: (name) => <span className="font-semibold text-slate-800 dark:text-slate-200">{name}</span>,
            },
            {
              header: 'Start Date',
              key: 'startDate',
              render: (d) => <span>{new Date(d).toLocaleDateString()}</span>,
            },
            {
              header: 'End Date',
              key: 'endDate',
              render: (d) => <span>{new Date(d).toLocaleDateString()}</span>,
            },
            {
              header: 'Status',
              key: 'isActive',
              render: (active) => (
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    active
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {active ? 'CURRENT' : 'CONCLUDED'}
                </span>
              ),
            },
          ]}
          data={semesters}
          loading={loading}
          searchPlaceholder="Search semesters..."
        />
      )}

      {/* Modal: Add Department */}
      <Modal
        isOpen={modalType === 'dept'}
        onClose={() => setModalType(null)}
        title="Create Academic Department"
      >
        <form onSubmit={handleCreateDept} className="space-y-4">
          <Input
            label="Department Name"
            required
            value={deptForm.name}
            onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
            placeholder="e.g. Electrical Engineering"
          />
          <Input
            label="Department Code"
            required
            value={deptForm.code}
            onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value.toUpperCase() })}
            placeholder="e.g. EE"
          />
          <Textarea
            label="Description"
            value={deptForm.description}
            onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
            <Button variant="secondary" onClick={() => setModalType(null)}>
              Cancel
            </Button>
            <Button type="submit" loading={actionLoading}>
              Save Department
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add Program */}
      <Modal
        isOpen={modalType === 'prog'}
        onClose={() => setModalType(null)}
        title="Create Degree Program"
      >
        <form onSubmit={handleCreateProg} className="space-y-4">
          <Input
            label="Program Title"
            required
            value={progForm.name}
            onChange={(e) => setProgForm({ ...progForm, name: e.target.value })}
            placeholder="e.g. Bachelor of Science in AI"
          />
          <Input
            label="Program Code"
            required
            value={progForm.code}
            onChange={(e) => setProgForm({ ...progForm, code: e.target.value.toUpperCase() })}
            placeholder="e.g. BSAI"
          />
          <Select
            label="Department"
            required
            value={progForm.departmentId}
            onChange={(e) => setProgForm({ ...progForm, departmentId: e.target.value })}
          >
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
            <Button variant="secondary" onClick={() => setModalType(null)}>
              Cancel
            </Button>
            <Button type="submit" loading={actionLoading}>
              Save Program
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add Course */}
      <Modal
        isOpen={modalType === 'course'}
        onClose={() => setModalType(null)}
        title="Add Course to Catalog"
      >
        <form onSubmit={handleCreateCourse} className="space-y-4">
          <Input
            label="Course Code"
            required
            value={courseForm.code}
            onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value.toUpperCase() })}
            placeholder="e.g. CS-301"
          />
          <Input
            label="Course Title"
            required
            value={courseForm.title}
            onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
            placeholder="e.g. Distributed Systems"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Credits"
              type="number"
              required
              min="1"
              max="6"
              value={courseForm.credits}
              onChange={(e) => setCourseForm({ ...courseForm, credits: e.target.value })}
            />
            <Select
              label="Department"
              required
              value={courseForm.departmentId}
              onChange={(e) => setCourseForm({ ...courseForm, departmentId: e.target.value })}
            >
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </div>
          <Textarea
            label="Course Description / Syllabus"
            value={courseForm.description}
            onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
            <Button variant="secondary" onClick={() => setModalType(null)}>
              Cancel
            </Button>
            <Button type="submit" loading={actionLoading}>
              Save Course
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Schedule Class Slot (with Conflict Handling) */}
      <Modal
        isOpen={modalType === 'slot'}
        onClose={() => setModalType(null)}
        title="Schedule Classroom Time Slot"
      >
        {conflictError && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{conflictError}</span>
          </div>
        )}

        <form onSubmit={handleCreateSlot} className="space-y-4">
          <Select
            label="Course"
            required
            value={slotForm.courseId}
            onChange={(e) => setSlotForm({ ...slotForm, courseId: e.target.value })}
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} - {c.title}
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Day"
              value={slotForm.day}
              onChange={(e) => setSlotForm({ ...slotForm, day: e.target.value })}
            >
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Select>

            <Input
              label="Classroom / Lab"
              required
              value={slotForm.room}
              onChange={(e) => setSlotForm({ ...slotForm, room: e.target.value })}
              placeholder="e.g. Hall 101, Lab B"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Time"
              type="time"
              required
              value={slotForm.startTime}
              onChange={(e) => setSlotForm({ ...slotForm, startTime: e.target.value })}
            />
            <Input
              label="End Time"
              type="time"
              required
              value={slotForm.endTime}
              onChange={(e) => setSlotForm({ ...slotForm, endTime: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
            <Button variant="secondary" onClick={() => setModalType(null)}>
              Cancel
            </Button>
            <Button type="submit" loading={actionLoading}>
              Schedule Slot
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
