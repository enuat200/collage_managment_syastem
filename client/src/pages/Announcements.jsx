import React, { useState, useEffect } from 'react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Modal } from '../components/common/Modal.jsx';
import { Input, Select, Textarea, Button } from '../components/common/FormComponents.jsx';
import { Card } from '../components/common/Card.jsx';
import {
  Megaphone,
  Plus,
  Calendar,
  User,
  AlertCircle,
  Pin,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { COLLEGE_IMAGES } from '../assets/collegeImages.js';

export const Announcements = () => {
  const { role } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [createModal, setCreateModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Form
  const [form, setForm] = useState({
    title: '',
    content: '',
    audience: 'ALL',
    priority: 'NORMAL',
  });

  const canPost = ['SUPER_ADMIN', 'COLLEGE_ADMIN', 'TEACHER', 'REGISTRAR'].includes(role);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await api.get('/communication/announcements');
      setAnnouncements(res || []);
    } catch (err) {
      console.error('Error fetching announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.post('/communication/announcements', form);
      setCreateModal(false);
      setForm({ title: '', content: '', audience: 'ALL', priority: 'NORMAL' });
      fetchAnnouncements();
    } catch (err) {
      alert(err.message || 'Failed to publish announcement');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this announcement?')) return;
    try {
      await api.delete(`/communication/announcements/${id}`);
      fetchAnnouncements();
    } catch (err) {
      alert(err.message || 'Failed to delete announcement');
    }
  };

  return (
    <div className="space-y-6">
      {/* Visual Page Banner with University Campus Life & Event Imagery */}
      <div className="relative rounded-2xl overflow-hidden shadow-md text-white border border-indigo-400/20">
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
          style={{ backgroundImage: `url(${COLLEGE_IMAGES.events.symposium})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-indigo-950/85 to-indigo-900/70" />
        <div className="relative z-10 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                University Communications
              </span>
              <span className="text-xs text-indigo-200">Campus Bulletins &amp; Key Dates</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Campus Bulletins &amp; Announcements
            </h2>
            <p className="text-xs sm:text-sm text-indigo-100/90 mt-1 max-w-xl">
              Official institutional notices, academic symposiums, examination guidelines, and student life activities.
            </p>
          </div>

          {canPost && (
            <Button
              icon={Plus}
              onClick={() => setCreateModal(true)}
              className="bg-white text-slate-900 hover:bg-slate-100 shadow-md font-bold shrink-0 self-start sm:self-auto"
            >
              Publish Announcement
            </Button>
          )}
        </div>
      </div>

      {/* Announcements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <p className="text-xs text-slate-400 col-span-2 py-8 text-center">Loading notices...</p>
        ) : announcements.length === 0 ? (
          <Card className="col-span-2 text-center py-12">
            <Megaphone className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h4 className="font-semibold text-slate-700 dark:text-slate-300">No active announcements</h4>
            <p className="text-xs text-slate-400 mt-1">There are no notices published for your role at this time.</p>
          </Card>
        ) : (
          announcements.map((item) => (
            <Card
              key={item.id}
              className={`relative border-l-4 ${
                item.priority === 'URGENT'
                  ? 'border-l-rose-500 dark:border-l-rose-400'
                  : item.priority === 'HIGH'
                  ? 'border-l-amber-500 dark:border-l-amber-400'
                  : 'border-l-indigo-500 dark:border-l-indigo-400'
              }`}
            >
              {/* Event Cover Thumbnail */}
              <div className="h-28 -mt-6 -mx-6 mb-4 relative overflow-hidden bg-slate-900">
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-500 hover:scale-105"
                  style={{
                    backgroundImage: `url(${
                      item.priority === 'URGENT'
                        ? COLLEGE_IMAGES.events.hackathon
                        : item.priority === 'HIGH'
                        ? COLLEGE_IMAGES.events.convocation
                        : COLLEGE_IMAGES.events.symposium
                    })`,
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                <span className="absolute bottom-2 left-4 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-black/60 text-amber-300 backdrop-blur-xs border border-white/20">
                  Campus Announcement &bull; {item.audience}
                </span>
              </div>

              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      item.priority === 'URGENT'
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400'
                        : item.priority === 'HIGH'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                        : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400'
                    }`}
                  >
                    {item.priority}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Audience: {item.audience}
                  </span>
                </div>

                {role === 'SUPER_ADMIN' && (
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-slate-400 hover:text-rose-600 p-1"
                    title="Delete notice"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base mt-2">
                {item.title}
              </h3>

              <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 whitespace-pre-line leading-relaxed">
                {item.content}
              </p>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5" /> By {item.author?.name || 'College Administration'}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> {new Date(item.createdAt).toLocaleDateString()}
                </span>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Modal: Publish Announcement */}
      <Modal
        isOpen={createModal}
        onClose={() => setCreateModal(false)}
        title="Broadcast Campus Announcement"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Announcement Title"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Fall 2026 Examination Schedule Released"
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Target Audience"
              value={form.audience}
              onChange={(e) => setForm({ ...form, audience: e.target.value })}
            >
              <option value="ALL">All Campus (Everyone)</option>
              <option value="STUDENTS">Students Only</option>
              <option value="TEACHERS">Faculty Only</option>
              <option value="ADMINS">Administrators Only</option>
            </Select>

            <Select
              label="Priority Level"
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
            >
              <option value="NORMAL">Normal</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent Alert</option>
            </Select>
          </div>

          <Textarea
            label="Notice Content"
            required
            rows={5}
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            placeholder="Write announcement details..."
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
            <Button variant="secondary" onClick={() => setCreateModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={actionLoading}>
              Publish Notice
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
