import React, { useState, useEffect } from 'react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Table } from '../components/common/Table.jsx';
import { Modal } from '../components/common/Modal.jsx';
import { Input, Select, Button } from '../components/common/FormComponents.jsx';
import { Card, StatCard } from '../components/common/Card.jsx';
import { StatusBadge } from '../components/common/Badge.jsx';
import {
  CalendarCheck,
  CheckCircle2,
  Clock,
  XCircle,
  HelpCircle,
  Users,
  Plus,
  Eye,
} from 'lucide-react';

export const Attendance = () => {
  const { user, role } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Student specific data
  const [studentSummary, setStudentSummary] = useState(null);

  // Take Attendance State
  const [isTakingAttendance, setIsTakingAttendance] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [sessionDate, setSessionDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [sessionTopic, setSessionTopic] = useState('');
  const [sessionRoom, setSessionRoom] = useState('Hall 101');
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [rosterAttendance, setRosterAttendance] = useState({}); // studentId -> status
  const [submitting, setSubmitting] = useState(false);

  // View Session Modal
  const [viewSessionModal, setViewSessionModal] = useState(false);
  const [activeSession, setActiveSession] = useState(null);

  const isStudent = role === 'STUDENT';
  const canMark = ['SUPER_ADMIN', 'COLLEGE_ADMIN', 'REGISTRAR', 'TEACHER'].includes(role);

  const fetchInitial = async () => {
    try {
      setLoading(true);
      if (isStudent) {
        if (user?.student?.id) {
          const res = await api.get(`/attendance/student/${user.student.id}`);
          setStudentSummary(res);
        }
      } else {
        const [cRes, sRes] = await Promise.all([
          api.get('/academics/courses'),
          api.get('/attendance/sessions'),
        ]);
        setCourses(cRes || []);
        setSessions(sRes || []);
        if (cRes && cRes.length > 0) {
          setSelectedCourseId(String(cRes[0].id));
        }
      }
    } catch (err) {
      console.error('Error fetching attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitial();
  }, [role, user]);

  // Load students when opening attendance sheet
  const handleStartAttendance = async () => {
    if (!selectedCourseId) return;
    try {
      setSubmitting(true);
      // Fetch enrollments for course
      const res = await api.get('/academics/enrollments', { courseId: selectedCourseId });
      const studentsList = (res || []).map((e) => ({
        id: e.student?.id,
        rollNo: e.student?.rollNo,
        name: e.student?.user?.name,
        email: e.student?.user?.email,
      }));

      // If no enrollments exist for this course, fallback to all active students
      let finalStudents = studentsList.filter((s) => s.id);
      if (finalStudents.length === 0) {
        const allStudentsRes = await api.get('/students', { limit: 20 });
        finalStudents = (allStudentsRes.data || []).map((s) => ({
          id: s.id,
          rollNo: s.rollNo,
          name: s.user?.name,
          email: s.user?.email,
        }));
      }

      setEnrolledStudents(finalStudents);

      // Default everyone to PRESENT
      const initialMap = {};
      finalStudents.forEach((s) => {
        initialMap[s.id] = 'PRESENT';
      });
      setRosterAttendance(initialMap);
      setIsTakingAttendance(true);
    } catch (err) {
      alert('Error fetching roster: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkAll = (status) => {
    const updated = {};
    enrolledStudents.forEach((s) => {
      updated[s.id] = status;
    });
    setRosterAttendance(updated);
  };

  const handleSubmitAttendance = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const records = enrolledStudents.map((s) => ({
        studentId: s.id,
        status: rosterAttendance[s.id] || 'PRESENT',
        remarks: null,
      }));

      await api.post('/attendance/sessions', {
        courseId: Number(selectedCourseId),
        date: sessionDate,
        topic: sessionTopic || 'Regular Lecture',
        room: sessionRoom,
        records,
      });

      alert('Attendance session recorded successfully!');
      setIsTakingAttendance(false);
      fetchInitial();
    } catch (err) {
      alert(err.message || 'Failed to submit attendance');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewSession = async (sess) => {
    try {
      const full = await api.get(`/attendance/sessions/${sess.id}`);
      setActiveSession(full);
      setViewSessionModal(true);
    } catch (err) {
      alert('Error loading session details');
    }
  };

  // If role is Student, show Student Attendance Dashboard
  if (isStudent) {
    const records = studentSummary?.records || [];
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">My Attendance</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Attendance percentage and detailed class log
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <StatCard
            title="Attendance Rate"
            value={`${studentSummary?.percentage ?? 100}%`}
            icon={CalendarCheck}
            color={Number(studentSummary?.percentage || 100) >= 75 ? 'emerald' : 'rose'}
          />
          <StatCard
            title="Present Sessions"
            value={studentSummary?.present ?? 0}
            icon={CheckCircle2}
            color="emerald"
          />
          <StatCard
            title="Late Sessions"
            value={studentSummary?.late ?? 0}
            icon={Clock}
            color="amber"
          />
          <StatCard
            title="Absent Sessions"
            value={studentSummary?.absent ?? 0}
            icon={XCircle}
            color="rose"
          />
        </div>

        <Card title="Attendance Record Timeline">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Course</th>
                  <th className="py-2.5 px-3">Topic / Lesson</th>
                  <th className="py-2.5 px-3">Instructor</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {records.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-6 text-center text-slate-400">
                      No attendance records found yet.
                    </td>
                  </tr>
                ) : (
                  records.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 font-medium">
                        {new Date(rec.session?.date).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-indigo-600 dark:text-indigo-400">
                        {rec.session?.course?.code}: {rec.session?.course?.title}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                        {rec.session?.topic || 'Regular Lecture'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">
                        {rec.session?.teacher?.user?.name || 'Faculty Member'}
                      </td>
                      <td className="py-2.5 px-3">
                        <StatusBadge status={rec.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  }

  // Teacher / Admin View
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Class Attendance</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Record daily attendance sessions and view course attendance logs
          </p>
        </div>

        {canMark && !isTakingAttendance && (
          <Button icon={Plus} onClick={() => setIsTakingAttendance(true)}>
            Record New Session
          </Button>
        )}
      </div>

      {/* Taking Attendance Sheet Form */}
      {isTakingAttendance ? (
        <Card title="Attendance Roll Call Sheet" subtitle="Select course, date, and mark status">
          <form onSubmit={handleSubmitAttendance} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <Select
                label="Course"
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                required
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} - {c.title}
                  </option>
                ))}
              </Select>

              <Input
                label="Date"
                type="date"
                required
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
              />

              <Input
                label="Topic / Lecture Title"
                placeholder="e.g. Memory Management"
                value={sessionTopic}
                onChange={(e) => setSessionTopic(e.target.value)}
              />

              <div className="flex items-end">
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full"
                  onClick={handleStartAttendance}
                  loading={submitting}
                >
                  Load Students
                </Button>
              </div>
            </div>

            {/* Quick Action Buttons */}
            {enrolledStudents.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Total Students: {enrolledStudents.length}
                </span>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 mr-1">Batch Actions:</span>
                  <button
                    type="button"
                    onClick={() => handleMarkAll('PRESENT')}
                    className="px-2.5 py-1 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-medium hover:bg-emerald-100"
                  >
                    All Present
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMarkAll('ABSENT')}
                    className="px-2.5 py-1 rounded bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-xs font-medium hover:bg-rose-100"
                  >
                    All Absent
                  </button>
                </div>
              </div>
            )}

            {/* Students Attendance List */}
            {enrolledStudents.length > 0 && (
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-semibold">
                      <th className="py-2.5 px-4">Roll No</th>
                      <th className="py-2.5 px-4">Student Name</th>
                      <th className="py-2.5 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {enrolledStudents.map((s) => {
                      const curStatus = rosterAttendance[s.id] || 'PRESENT';
                      return (
                        <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="py-2.5 px-4 font-mono font-semibold text-slate-700 dark:text-slate-300">
                            {s.rollNo}
                          </td>
                          <td className="py-2.5 px-4 font-medium text-slate-800 dark:text-slate-100">
                            {s.name}
                          </td>
                          <td className="py-2.5 px-4">
                            <div className="flex items-center justify-center gap-2">
                              {['PRESENT', 'LATE', 'ABSENT', 'EXCUSED'].map((st) => (
                                <button
                                  key={st}
                                  type="button"
                                  onClick={() =>
                                    setRosterAttendance({ ...rosterAttendance, [s.id]: st })
                                  }
                                  className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                                    curStatus === st
                                      ? st === 'PRESENT'
                                        ? 'bg-emerald-600 text-white'
                                        : st === 'LATE'
                                        ? 'bg-amber-600 text-white'
                                        : st === 'ABSENT'
                                        ? 'bg-rose-600 text-white'
                                        : 'bg-sky-600 text-white'
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                                  }`}
                                >
                                  {st}
                                </button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="secondary"
                type="button"
                onClick={() => setIsTakingAttendance(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={submitting}
                disabled={enrolledStudents.length === 0}
              >
                Save Attendance Session
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        /* History of Sessions */
        <Table
          columns={[
            {
              header: 'Date',
              key: 'date',
              render: (d) => <span>{new Date(d).toLocaleDateString()}</span>,
            },
            {
              header: 'Course',
              key: 'course.code',
              render: (_, row) => (
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                  {row.course?.code} - {row.course?.title}
                </span>
              ),
            },
            {
              header: 'Topic / Lesson',
              key: 'topic',
              render: (topic) => <span>{topic || 'Regular Lecture'}</span>,
            },
            {
              header: 'Instructor',
              key: 'teacher.user.name',
              render: (_, row) => <span>{row.teacher?.user?.name || 'Assigned Faculty'}</span>,
            },
            {
              header: 'Records',
              key: '_count.records',
              render: (cnt) => <span>{cnt} Students</span>,
            },
            {
              header: 'Action',
              key: 'actions',
              align: 'right',
              render: (_, row) => (
                <button
                  onClick={() => handleViewSession(row)}
                  className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md"
                  title="View Records"
                >
                  <Eye className="w-4 h-4" />
                </button>
              ),
            },
          ]}
          data={sessions}
          loading={loading}
          searchPlaceholder="Search past sessions by course or date..."
          emptyTitle="No attendance sessions recorded"
        />
      )}

      {/* View Session Details Modal */}
      <Modal
        isOpen={viewSessionModal}
        onClose={() => setViewSessionModal(false)}
        title={`Session: ${activeSession?.course?.code} on ${new Date(activeSession?.date).toLocaleDateString()}`}
        maxWidth="max-w-2xl"
      >
        {activeSession && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs space-y-1">
              <p>
                <strong className="text-slate-800 dark:text-slate-200">Topic:</strong>{' '}
                {activeSession.topic || 'Regular Lecture'}
              </p>
              <p>
                <strong className="text-slate-800 dark:text-slate-200">Instructor:</strong>{' '}
                {activeSession.teacher?.user?.name}
              </p>
            </div>

            <div className="max-h-80 overflow-y-auto border border-slate-100 dark:border-slate-800 rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2 px-3">Roll No</th>
                    <th className="py-2 px-3">Student Name</th>
                    <th className="py-2 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(activeSession.records || []).map((r) => (
                    <tr key={r.id}>
                      <td className="py-2 px-3 font-mono">{r.student?.rollNo}</td>
                      <td className="py-2 px-3 font-medium">{r.student?.user?.name}</td>
                      <td className="py-2 px-3">
                        <StatusBadge status={r.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
