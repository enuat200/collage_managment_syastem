import React, { useState, useEffect } from 'react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Table } from '../components/common/Table.jsx';
import { Modal } from '../components/common/Modal.jsx';
import { Input, Select, Textarea, Button } from '../components/common/FormComponents.jsx';
import { Card, StatCard } from '../components/common/Card.jsx';
import { StatusBadge } from '../components/common/Badge.jsx';
import {
  Library as LibraryIcon,
  BookOpen,
  Plus,
  BookmarkCheck,
  RotateCcw,
  Search,
  AlertTriangle,
  Barcode,
} from 'lucide-react';

export const Library = () => {
  const { user, role } = useAuth();
  const [activeTab, setActiveTab] = useState('catalog'); // 'catalog' | 'loans'
  const [books, setBooks] = useState([]);
  const [loans, setLoans] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [addBookModal, setAddBookModal] = useState(false);
  const [borrowModal, setBorrowModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Forms
  const [bookForm, setBookForm] = useState({
    isbn: '',
    title: '',
    author: '',
    publisher: 'MIT Press',
    publicationYear: 2024,
    category: 'Computer Science',
    totalCopies: 5,
    shelfLocation: 'Stack A-12',
    description: '',
  });

  const [borrowForm, setBorrowForm] = useState({
    userId: '',
    days: 14,
  });

  const canManage = ['SUPER_ADMIN', 'COLLEGE_ADMIN', 'LIBRARIAN'].includes(role);

  const fetchLibraryData = async () => {
    try {
      setLoading(true);
      const [bRes, lRes, uRes] = await Promise.all([
        api.get('/library/books'),
        api.get('/library/loans').catch(() => []),
        canManage ? api.get('/admin/users').catch(() => []) : Promise.resolve([]),
      ]);
      setBooks(bRes || []);
      setLoans(lRes || []);
      setUsersList(uRes || []);
      if (uRes && uRes.length > 0 && !borrowForm.userId) {
        setBorrowForm((prev) => ({ ...prev, userId: String(uRes[0].id) }));
      }
    } catch (err) {
      console.error('Error loading library:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLibraryData();
  }, [role]);

  const handleOpenAddBook = () => {
    setBookForm({
      isbn: `978-0-${Math.floor(100000 + Math.random() * 900000)}`,
      title: '',
      author: '',
      publisher: 'Pearson',
      publicationYear: 2025,
      category: 'Computer Science',
      totalCopies: 4,
      shelfLocation: 'Stack CS-04',
      description: '',
    });
    setAddBookModal(true);
  };

  const handleCreateBook = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.post('/library/books', {
        ...bookForm,
        publicationYear: Number(bookForm.publicationYear),
        totalCopies: Number(bookForm.totalCopies),
      });
      setAddBookModal(false);
      fetchLibraryData();
    } catch (err) {
      alert(err.message || 'Failed to add book');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenBorrow = (book) => {
    setSelectedBook(book);
    setBorrowForm({
      userId: usersList[0]?.id ? String(usersList[0].id) : '',
      days: 14,
    });
    setBorrowModal(true);
  };

  const handleBorrowSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.post('/library/loans', {
        bookId: selectedBook.id,
        userId: Number(borrowForm.userId),
        days: Number(borrowForm.days),
      });
      alert('Book copy issued successfully!');
      setBorrowModal(false);
      fetchLibraryData();
    } catch (err) {
      alert(err.message || 'Failed to issue book');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReturnBook = async (loanId) => {
    if (!confirm('Confirm return of this book copy?')) return;
    try {
      const res = await api.put(`/library/loans/${loanId}/return`, { condition: 'GOOD' });
      if (res.fineAmount && res.fineAmount > 0) {
        alert(`Book returned. An overdue fine of $${res.fineAmount} has been charged.`);
      } else {
        alert('Book returned in good order.');
      }
      fetchLibraryData();
    } catch (err) {
      alert(err.message || 'Error processing book return');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Library & Media Center</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Book repository catalog, physical inventory, and loan circulation
          </p>
        </div>

        {canManage && (
          <Button icon={Plus} onClick={handleOpenAddBook}>
            Add Book to Catalog
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard
          title="Catalog Titles"
          value={books.length}
          icon={BookOpen}
          color="indigo"
        />
        <StatCard
          title="Available Copies"
          value={books.reduce((acc, b) => acc + (b.availableCopies || 0), 0)}
          icon={BookmarkCheck}
          color="emerald"
        />
        <StatCard
          title="Active Loans"
          value={loans.filter((l) => l.status === 'BORROWED').length}
          icon={LibraryIcon}
          color="amber"
        />
        <StatCard
          title="Overdue Items"
          value={loans.filter((l) => l.status === 'OVERDUE').length}
          icon={AlertTriangle}
          color="rose"
        />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`py-2 px-4 text-sm font-medium border-b-2 transition ${
            activeTab === 'catalog'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Book Catalog ({books.length})
        </button>
        <button
          onClick={() => setActiveTab('loans')}
          className={`py-2 px-4 text-sm font-medium border-b-2 transition ${
            activeTab === 'loans'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Circulation & Loans ({loans.length})
        </button>
      </div>

      {/* Tab: Catalog */}
      {activeTab === 'catalog' && (
        <Table
          columns={[
            {
              header: 'ISBN',
              key: 'isbn',
              render: (isbn) => <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-400">{isbn}</span>,
            },
            {
              header: 'Title & Author',
              key: 'title',
              render: (_, row) => (
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{row.title}</p>
                  <p className="text-xs text-slate-400">By {row.author} &bull; {row.publisher}</p>
                </div>
              ),
            },
            {
              header: 'Category',
              key: 'category',
              render: (cat) => (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {cat}
                </span>
              ),
            },
            {
              header: 'Location',
              key: 'shelfLocation',
              render: (loc) => <span className="text-xs font-mono">{loc || 'General'}</span>,
            },
            {
              header: 'Availability',
              key: 'availableCopies',
              render: (_, row) => (
                <span
                  className={`text-xs font-semibold ${
                    row.availableCopies > 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {row.availableCopies} of {row.totalCopies} available
                </span>
              ),
            },
            {
              header: 'Actions',
              key: 'actions',
              align: 'right',
              render: (_, row) =>
                canManage && row.availableCopies > 0 ? (
                  <Button
                    size="sm"
                    variant="outline"
                    icon={BookmarkCheck}
                    onClick={() => handleOpenBorrow(row)}
                  >
                    Issue Copy
                  </Button>
                ) : null,
            },
          ]}
          data={books}
          loading={loading}
          searchPlaceholder="Search catalog by title, author, or ISBN..."
        />
      )}

      {/* Tab: Loans */}
      {activeTab === 'loans' && (
        <Table
          columns={[
            {
              header: 'Book',
              key: 'book.title',
              render: (_, row) => (
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{row.book?.title}</p>
                  <p className="text-xs text-slate-400 font-mono">Barcode: {row.copy?.barcode || 'N/A'}</p>
                </div>
              ),
            },
            {
              header: 'Borrower',
              key: 'user.name',
              render: (_, row) => (
                <div>
                  <p className="font-medium text-slate-800 dark:text-slate-200">{row.user?.name}</p>
                  <p className="text-xs text-slate-400">{row.user?.email}</p>
                </div>
              ),
            },
            {
              header: 'Borrow Date',
              key: 'borrowDate',
              render: (d) => <span className="text-xs text-slate-600 dark:text-slate-400">{new Date(d).toLocaleDateString()}</span>,
            },
            {
              header: 'Due Date',
              key: 'dueDate',
              render: (d) => <span className="text-xs text-slate-600 dark:text-slate-400">{new Date(d).toLocaleDateString()}</span>,
            },
            {
              header: 'Status',
              key: 'status',
              render: (st) => <StatusBadge status={st} />,
            },
            {
              header: 'Action',
              key: 'actions',
              align: 'right',
              render: (_, row) =>
                canManage && row.status === 'BORROWED' ? (
                  <Button
                    size="sm"
                    variant="success"
                    icon={RotateCcw}
                    onClick={() => handleReturnBook(row.id)}
                  >
                    Return Book
                  </Button>
                ) : null,
            },
          ]}
          data={loans}
          loading={loading}
          searchPlaceholder="Search loans by borrower or book..."
        />
      )}

      {/* Add Book Modal */}
      <Modal
        isOpen={addBookModal}
        onClose={() => setAddBookModal(false)}
        title="Add Book to Library Catalog"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleCreateBook} className="space-y-4">
          <Input
            label="Book Title"
            required
            value={bookForm.title}
            onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
            placeholder="e.g. Introduction to Algorithms"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Author(s)"
              required
              value={bookForm.author}
              onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
              placeholder="e.g. Thomas H. Cormen"
            />
            <Input
              label="ISBN"
              required
              value={bookForm.isbn}
              onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Category"
              value={bookForm.category}
              onChange={(e) => setBookForm({ ...bookForm, category: e.target.value })}
            />
            <Input
              label="Shelf Location"
              value={bookForm.shelfLocation}
              onChange={(e) => setBookForm({ ...bookForm, shelfLocation: e.target.value })}
            />
            <Input
              label="Copies"
              type="number"
              min="1"
              max="100"
              required
              value={bookForm.totalCopies}
              onChange={(e) => setBookForm({ ...bookForm, totalCopies: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
            <Button variant="secondary" onClick={() => setAddBookModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={actionLoading}>
              Save to Catalog
            </Button>
          </div>
        </form>
      </Modal>

      {/* Issue Book Modal */}
      <Modal
        isOpen={borrowModal}
        onClose={() => setBorrowModal(false)}
        title={`Issue Book: ${selectedBook?.title}`}
      >
        <form onSubmit={handleBorrowSubmit} className="space-y-4">
          <Select
            label="Borrower (Student / Faculty)"
            required
            value={borrowForm.userId}
            onChange={(e) => setBorrowForm({ ...borrowForm, userId: e.target.value })}
          >
            {usersList.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.role}) - {u.email}
              </option>
            ))}
          </Select>

          <Input
            label="Loan Period (Days)"
            type="number"
            min="1"
            max="90"
            required
            value={borrowForm.days}
            onChange={(e) => setBorrowForm({ ...borrowForm, days: e.target.value })}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
            <Button variant="secondary" onClick={() => setBorrowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={actionLoading}>
              Confirm Book Issue
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
