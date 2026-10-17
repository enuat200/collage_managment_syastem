import React, { useState, useEffect } from 'react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Table } from '../components/common/Table.jsx';
import { Modal } from '../components/common/Modal.jsx';
import { Input, Select, Button } from '../components/common/FormComponents.jsx';
import { Card } from '../components/common/Card.jsx';
import { StatusBadge } from '../components/common/Badge.jsx';
import {
  Award,
  Plus,
  Edit3,
  Globe,
  Printer,
  CheckCircle,
  FileText,
  AlertCircle,
} from 'lucide-react';

export const Exams = ({ initialStudentId }) => {
  const { user, role } = useAuth();
  const [exams, setExams] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create Exam Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [examForm, setExamForm] = useState({
    title: 'Midterm Examination',
    examType: 'MIDTERM',
    courseId: '',
    examDate: new Date().toISOString().split('T')[0],
    startTime: '10:00',
    endTime: '12:00',
    room: 'Hall 101',
    totalMarks: 100,
    weightagePercent: 30,
  });

  // Enter Marks Modal
  const [marksModalOpen, setMarksModalOpen] = useState(false);
  const [activeExam, setActiveExam] = useState(null);
  const [studentsRoster, setStudentsRoster] = useState([]);
  const [scoresMap, setScoresMap] = useState({}); // studentId -> { score, feedback }

  // Report Card / Transcript Modal
  const [transcriptModalOpen, setTranscriptModalOpen] = useState(false);
  const [reportCard, setReportCard] = useState(null);
  const [transcriptLoading, setTranscriptLoading] = useState(false);

  const isStudent = role === 'STUDENT';
  const canCreate = ['SUPER_ADMIN', 'COLLEGE_ADMIN', 'REGISTRAR', 'TEACHER'].includes(role);
  const canPublish = ['SUPER_ADMIN', 'COLLEGE_ADMIN', 'REGISTRAR'].includes(role);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const [eRes, cRes] = await Promise.all([
        api.get('/exams'),
        api.get('/academics/courses').catch(() => []),
      ]);
      setExams(eRes || []);
      setCourses(cRes || []);
      if (cRes && cRes.length > 0 && !examForm.courseId) {
        setExamForm((prev) => ({ ...prev, courseId: String(cRes[0].id) }));
      }
    } catch (err) {
      console.error('Error fetching exams:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
    if (initialStudentId) {
      handleViewReportCard(initialStudentId);
    } else if (isStudent && user?.student?.id) {
      handleViewReportCard(user.student.id);
    }
  }, [role, user, initialStudentId]);

  const handleCreateExam = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.post('/exams', {
        ...examForm,
        courseId: Number(examForm.courseId),
        totalMarks: Number(examForm.totalMarks),
        weightagePercent: Number(examForm.weightagePercent),
      });
      setCreateModalOpen(false);
      fetchExams();
    } catch (err) {
      alert(err.message || 'Failed to schedule exam');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenEnterMarks = async (exam) => {
    try {
      setActionLoading(true);
      const full = await api.get(`/exams/${exam.id}`);
      setActiveExam(full);

      // Load enrolled students or all students
      const enrRes = await api.get('/academics/enrollments', { courseId: exam.courseId }).catch(() => []);
      let students = enrRes.map((e) => ({
        id: e.student?.id,
        enrollmentId: e.id,
        name: e.student?.user?.name,
        rollNo: e.student?.rollNo,
      })).filter((s) => s.id);

      if (students.length === 0) {
        const fallback = await api.get('/students', { limit: 20 });
        students = (fallback.data || []).map((s) => ({
          id: s.id,
          enrollmentId: 1,
          name: s.user?.name,
          rollNo: s.rollNo,
        }));
      }

      setStudentsRoster(students);

      // Populate existing marks
      const initialScores = {};
      students.forEach((s) => {
        const existing = (full.marks || []).find((m) => m.studentId === s.id);
        initialScores[s.id] = {
          score: existing ? existing.score : '',
          feedback: existing?.feedback || '',
        };
      });
      setScoresMap(initialScores);
      setMarksModalOpen(true);
    } catch (err) {
      alert('Error loading exam marks: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveMarks = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const marksPayload = Object.entries(scoresMap)
        .filter(([_, v]) => v.score !== '' && v.score !== undefined)
        .map(([studentId, v]) => ({
          studentId: Number(studentId),
          score: Number(v.score),
          feedback: v.feedback || null,
        }));

      await api.post(`/exams/${activeExam.id}/marks`, { marks: marksPayload });
      alert('Examination marks submitted successfully!');
      setMarksModalOpen(false);
      fetchExams();
    } catch (err) {
      alert(err.message || 'Failed to save marks');
    } finally {
      setActionLoading(false);
    }
  };

  const handleTogglePublish = async (exam) => {
    const nextState = !exam.isPublished;
    if (!confirm(`Are you sure you want to ${nextState ? 'PUBLISH' : 'UNPUBLISH'} results for "${exam.title}"?`)) return;

    try {
      await api.put(`/exams/${exam.id}/publish`, { isPublished: nextState });
      fetchExams();
    } catch (err) {
      alert(err.message || 'Failed to toggle publication');
    }
  };

  const handleViewReportCard = async (studentId) => {
    try {
      setTranscriptLoading(true);
      const res = await api.get(`/exams/student/${studentId}/report-card`);
      setReportCard(res);
      setTranscriptModalOpen(true);
    } catch (err) {
      console.error('Error fetching report card:', err);
    } finally {
      setTranscriptLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Exams & Academic Grades</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Assessment scheduling, grading scale evaluation, and student transcripts
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isStudent && (
            <Button
              icon={FileText}
              variant="outline"
              onClick={() => user?.student?.id && handleViewReportCard(user.student.id)}
            >
              My Official Transcript
            </Button>
          )}

          {canCreate && (
            <Button icon={Plus} onClick={() => setCreateModalOpen(true)}>
              Schedule New Exam
            </Button>
          )}
        </div>
      </div>

      {/* Exams Table */}
      <Table
        columns={[
          {
            header: 'Exam Title',
            key: 'title',
            render: (title, row) => (
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">{title}</p>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-mono">
                  {row.course?.code} &bull; {row.examType}
                </p>
              </div>
            ),
          },
          {
            header: 'Course',
            key: 'course.title',
            render: (_, row) => <span>{row.course?.title}</span>,
          },
          {
            header: 'Date & Time',
            key: 'examDate',
            render: (d, row) => (
              <span className="text-xs text-slate-600 dark:text-slate-400">
                {new Date(d).toLocaleDateString()} &bull; {row.startTime || 'TBD'}
              </span>
            ),
          },
          {
            header: 'Total Marks',
            key: 'totalMarks',
            render: (m, row) => <span>{m} pts ({row.weightagePercent}%)</span>,
          },
          {
            header: 'Status',
            key: 'isPublished',
            render: (pub) => (
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  pub
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                }`}
              >
                {pub ? 'PUBLISHED' : 'DRAFT'}
              </span>
            ),
          },
          {
            header: 'Actions',
            key: 'actions',
            align: 'right',
            render: (_, row) => (
              <div className="flex items-center justify-end gap-1.5">
                {canCreate && (
                  <Button
                    size="sm"
                    variant="outline"
                    icon={Edit3}
                    onClick={() => handleOpenEnterMarks(row)}
                  >
                    Enter Marks
                  </Button>
                )}

                {canPublish && (
                  <button
                    onClick={() => handleTogglePublish(row)}
                    className={`p-1.5 rounded-md text-xs font-medium transition ${
                      row.isPublished
                        ? 'text-amber-600 hover:bg-amber-50'
                        : 'text-emerald-600 hover:bg-emerald-50'
                    }`}
                    title={row.isPublished ? 'Unpublish marks' : 'Publish marks to students'}
                  >
                    <Globe className="w-4 h-4" />
                  </button>
                )}
              </div>
            ),
          },
        ]}
        data={exams}
        loading={loading}
        searchPlaceholder="Search exams..."
        emptyTitle="No examinations scheduled"
      />

      {/* Schedule Exam Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Schedule New Examination"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleCreateExam} className="space-y-4">
          <Input
            label="Exam Title"
            required
            value={examForm.title}
            onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
            placeholder="e.g. Midterm Examination Fall 2026"
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Course"
              required
              value={examForm.courseId}
              onChange={(e) => setExamForm({ ...examForm, courseId: e.target.value })}
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} - {c.title}
                </option>
              ))}
            </Select>

            <Select
              label="Exam Type"
              value={examForm.examType}
              onChange={(e) => setExamForm({ ...examForm, examType: e.target.value })}
            >
              <option value="MIDTERM">MIDTERM</option>
              <option value="FINAL">FINAL</option>
              <option value="QUIZ">QUIZ</option>
              <option value="ASSIGNMENT">ASSIGNMENT</option>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date"
              type="date"
              required
              value={examForm.examDate}
              onChange={(e) => setExamForm({ ...examForm, examDate: e.target.value })}
            />
            <Input
              label="Room / Hall"
              value={examForm.room}
              onChange={(e) => setExamForm({ ...examForm, room: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Total Marks"
              type="number"
              required
              min="10"
              max="500"
              value={examForm.totalMarks}
              onChange={(e) => setExamForm({ ...examForm, totalMarks: e.target.value })}
            />
            <Input
              label="Weightage (%)"
              type="number"
              required
              min="1"
              max="100"
              value={examForm.weightagePercent}
              onChange={(e) => setExamForm({ ...examForm, weightagePercent: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
            <Button variant="secondary" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={actionLoading}>
              Schedule Exam
            </Button>
          </div>
        </form>
      </Modal>

      {/* Enter Marks Sheet Modal */}
      <Modal
        isOpen={marksModalOpen}
        onClose={() => setMarksModalOpen(false)}
        title={`Enter Marks: ${activeExam?.title} (Max: ${activeExam?.totalMarks} pts)`}
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleSaveMarks} className="space-y-4">
          <p className="text-xs text-slate-500">
            Scores will be automatically mapped to university letter grades and GPA quality points.
          </p>

          <div className="max-h-96 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-600 font-semibold sticky top-0">
                <tr>
                  <th className="py-2.5 px-3">Roll No</th>
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2.5 px-3 w-28">Score (/{activeExam?.totalMarks})</th>
                  <th className="py-2.5 px-3">Feedback / Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {studentsRoster.map((s) => {
                  const val = scoresMap[s.id] || { score: '', feedback: '' };
                  return (
                    <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-mono font-medium">{s.rollNo}</td>
                      <td className="py-2.5 px-3 font-semibold">{s.name}</td>
                      <td className="py-2.5 px-3">
                        <input
                          type="number"
                          min="0"
                          max={activeExam?.totalMarks || 100}
                          value={val.score}
                          onChange={(e) =>
                            setScoresMap({
                              ...scoresMap,
                              [s.id]: { ...val, score: e.target.value },
                            })
                          }
                          className="w-20 px-2 py-1 text-xs border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 font-mono"
                          placeholder="0"
                        />
                      </td>
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={val.feedback}
                          onChange={(e) =>
                            setScoresMap({
                              ...scoresMap,
                              [s.id]: { ...val, feedback: e.target.value },
                            })
                          }
                          className="w-full px-2 py-1 text-xs border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800"
                          placeholder="Optional feedback..."
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
            <Button variant="secondary" onClick={() => setMarksModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={actionLoading}>
              Save All Marks
            </Button>
          </div>
        </form>
      </Modal>

      {/* Official Academic Transcript / Report Card Modal */}
      <Modal
        isOpen={transcriptModalOpen}
        onClose={() => setTranscriptModalOpen(false)}
        title="Official Academic Transcript"
        maxWidth="max-w-3xl"
      >
        {reportCard && (
          <div className="space-y-6 printable-area bg-white dark:bg-slate-900 p-2">
            {/* College Transcript Header */}
            <div className="text-center pb-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white uppercase">
                UniManage Institute of Higher Learning
              </h3>
              <p className="text-xs text-slate-500">Official Student Academic Record & Transcript</p>
            </div>

            {/* Student Metadata Card */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Student Name</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">{reportCard.student?.name}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Roll / Student ID</span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{reportCard.student?.rollNo}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Department</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">{reportCard.student?.department}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Cumulative GPA</span>
                <span className="font-bold text-emerald-600 text-sm">{reportCard.cumulativeGpa} / 4.00</span>
              </div>
            </div>

            {/* Course Grades Breakdown */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 font-semibold text-slate-600 dark:text-slate-300">
                  <tr>
                    <th className="py-2.5 px-3">Course Code</th>
                    <th className="py-2.5 px-3">Course Title</th>
                    <th className="py-2.5 px-3 text-center">Credits</th>
                    <th className="py-2.5 px-3 text-center">Letter Grade</th>
                    <th className="py-2.5 px-3 text-center">Grade Point</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(reportCard.coursesReport || []).map((c, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 px-3 font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                        {c.courseCode}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">
                        {c.courseTitle}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono">{c.credits}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-900 dark:text-slate-100">
                        {c.letterGrade}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-semibold text-emerald-600">
                        {c.gradePoint}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary GPA */}
            <div className="flex items-center justify-between p-3 bg-indigo-50/60 dark:bg-indigo-950/40 rounded-xl text-xs font-semibold text-indigo-900 dark:text-indigo-200">
              <span>Total Credits Earned: {reportCard.totalCreditsEarned}</span>
              <span>Cumulative CGPA: {reportCard.cumulativeGpa}</span>
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700 no-print">
              <Button variant="outline" icon={Printer} onClick={handlePrint}>
                Print Official Copy
              </Button>
              <Button variant="secondary" onClick={() => setTranscriptModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
