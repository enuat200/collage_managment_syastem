import React, { useState, useEffect } from 'react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Table } from '../components/common/Table.jsx';
import { Modal } from '../components/common/Modal.jsx';
import { Input, Select, Textarea, Button } from '../components/common/FormComponents.jsx';
import { Card, StatCard } from '../components/common/Card.jsx';
import { StatusBadge } from '../components/common/Badge.jsx';
import {
  CreditCard,
  DollarSign,
  Plus,
  Receipt,
  Printer,
  Calendar,
  AlertTriangle,
  CheckCircle,
  FileText,
} from 'lucide-react';

export const Finance = () => {
  const { user, role } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Stats
  const [metrics, setMetrics] = useState({
    totalInvoiced: 0,
    totalCollected: 0,
    outstandingBalance: 0,
  });

  // Modals
  const [createInvoiceModal, setCreateInvoiceModal] = useState(false);
  const [recordPaymentModal, setRecordPaymentModal] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Forms
  const [invoiceForm, setInvoiceForm] = useState({
    studentId: '',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    tuitionFee: '3200',
    labFee: '400',
    libraryFee: '100',
    notes: 'Semester Tuition & Lab Maintenance Fee',
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: 'BANK_TRANSFER',
    transactionRef: '',
    notes: '',
  });

  const isStudent = role === 'STUDENT';
  const canManage = ['SUPER_ADMIN', 'COLLEGE_ADMIN', 'ACCOUNTANT'].includes(role);

  const fetchFinanceData = async () => {
    try {
      setLoading(true);
      const [invRes, stuRes] = await Promise.all([
        api.get('/finance/invoices'),
        canManage ? api.get('/students', { limit: 50 }).catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
      ]);

      const invList = invRes || [];
      setInvoices(invList);
      setStudents(stuRes.data || []);

      if (stuRes.data && stuRes.data.length > 0 && !invoiceForm.studentId) {
        setInvoiceForm((prev) => ({ ...prev, studentId: String(stuRes.data[0].id) }));
      }

      // Calculate totals
      const totalInv = invList.reduce((acc, i) => acc + Number(i.totalAmount || 0), 0);
      const totalCol = invList.reduce((acc, i) => acc + Number(i.paidAmount || 0), 0);
      const totalBal = invList.reduce((acc, i) => acc + Number(i.balance || 0), 0);
      setMetrics({
        totalInvoiced: totalInv,
        totalCollected: totalCol,
        outstandingBalance: totalBal,
      });
    } catch (err) {
      console.error('Error fetching finance data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinanceData();
  }, [role]);

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const items = [
        { title: 'Academic Tuition Fee', amount: Number(invoiceForm.tuitionFee) || 0 },
        { title: 'Computer & Science Lab Fee', amount: Number(invoiceForm.labFee) || 0 },
        { title: 'Library Access Fee', amount: Number(invoiceForm.libraryFee) || 0 },
      ].filter((item) => item.amount > 0);

      await api.post('/finance/invoices', {
        studentId: Number(invoiceForm.studentId),
        dueDate: invoiceForm.dueDate,
        items,
        notes: invoiceForm.notes,
      });

      setCreateInvoiceModal(false);
      fetchFinanceData();
    } catch (err) {
      alert(err.message || 'Failed to generate invoice');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenPayment = (inv) => {
    setSelectedInvoice(inv);
    setPaymentForm({
      amount: String(inv.balance),
      paymentMethod: 'BANK_TRANSFER',
      transactionRef: `TRX-${Math.floor(100000 + Math.random() * 900000)}`,
      notes: 'Tuition installment settlement',
    });
    setRecordPaymentModal(true);
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.post('/finance/payments', {
        invoiceId: selectedInvoice.id,
        amount: Number(paymentForm.amount),
        paymentMethod: paymentForm.paymentMethod,
        transactionRef: paymentForm.transactionRef,
        notes: paymentForm.notes,
      });

      alert('Payment recorded and balance reconciled successfully!');
      setRecordPaymentModal(false);
      fetchFinanceData();
    } catch (err) {
      alert(err.message || 'Payment processing error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewReceipt = async (inv) => {
    try {
      const full = await api.get(`/finance/invoices/${inv.id}`);
      setSelectedInvoice(full);
      setReceiptModalOpen(true);
    } catch (err) {
      alert('Error fetching receipt');
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
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Finance & Fee Management</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Student fee billings, payment collection, and ledger reconciliation
          </p>
        </div>

        {canManage && (
          <Button icon={Plus} onClick={() => setCreateInvoiceModal(true)}>
            Generate New Invoice
          </Button>
        )}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Invoiced"
          value={`$${metrics.totalInvoiced.toLocaleString()}`}
          icon={DollarSign}
          color="indigo"
        />
        <StatCard
          title="Collected Revenue"
          value={`$${metrics.totalCollected.toLocaleString()}`}
          icon={DollarSign}
          color="emerald"
        />
        <StatCard
          title="Outstanding Balance"
          value={`$${metrics.outstandingBalance.toLocaleString()}`}
          icon={AlertTriangle}
          color="rose"
        />
      </div>

      {/* Invoices Table */}
      <Table
        columns={[
          {
            header: 'Invoice #',
            key: 'invoiceNumber',
            render: (no) => <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{no}</span>,
          },
          {
            header: 'Student',
            key: 'student.user.name',
            render: (_, row) => (
              <div>
                <p className="font-medium text-slate-800 dark:text-slate-200">{row.student?.user?.name}</p>
                <p className="text-xs text-slate-400 font-mono">Roll: {row.student?.rollNo}</p>
              </div>
            ),
          },
          {
            header: 'Due Date',
            key: 'dueDate',
            render: (d) => <span className="text-xs text-slate-600 dark:text-slate-400">{new Date(d).toLocaleDateString()}</span>,
          },
          {
            header: 'Total / Paid / Balance',
            key: 'totalAmount',
            render: (_, row) => (
              <div className="text-xs">
                <p className="font-bold text-slate-800 dark:text-slate-100">${row.totalAmount}</p>
                <p className="text-[11px] text-slate-400">
                  Paid: <span className="text-emerald-600 font-semibold">${row.paidAmount}</span> | Bal:{' '}
                  <span className="text-rose-600 font-semibold">${row.balance}</span>
                </p>
              </div>
            ),
          },
          {
            header: 'Status',
            key: 'status',
            render: (st) => <StatusBadge status={st} />,
          },
          {
            header: 'Actions',
            key: 'actions',
            align: 'right',
            render: (_, row) => (
              <div className="flex items-center justify-end gap-1.5">
                <button
                  onClick={() => handleViewReceipt(row)}
                  className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md"
                  title="View / Print Receipt"
                >
                  <Receipt className="w-4 h-4" />
                </button>

                {canManage && row.balance > 0 && (
                  <Button
                    size="sm"
                    variant="success"
                    icon={CreditCard}
                    onClick={() => handleOpenPayment(row)}
                  >
                    Pay
                  </Button>
                )}
              </div>
            ),
          },
        ]}
        data={invoices}
        loading={loading}
        searchPlaceholder="Search invoices by number or student..."
        emptyTitle="No invoices found"
      />

      {/* Generate Invoice Modal */}
      <Modal
        isOpen={createInvoiceModal}
        onClose={() => setCreateInvoiceModal(false)}
        title="Generate Student Fee Invoice"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleCreateInvoice} className="space-y-4">
          <Select
            label="Select Student"
            required
            value={invoiceForm.studentId}
            onChange={(e) => setInvoiceForm({ ...invoiceForm, studentId: e.target.value })}
          >
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.user?.name} ({s.rollNo}) - {s.department?.code}
              </option>
            ))}
          </Select>

          <Input
            label="Payment Due Date"
            type="date"
            required
            value={invoiceForm.dueDate}
            onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
          />

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Tuition ($)"
              type="number"
              min="0"
              value={invoiceForm.tuitionFee}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, tuitionFee: e.target.value })}
            />
            <Input
              label="Lab Fee ($)"
              type="number"
              min="0"
              value={invoiceForm.labFee}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, labFee: e.target.value })}
            />
            <Input
              label="Library ($)"
              type="number"
              min="0"
              value={invoiceForm.libraryFee}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, libraryFee: e.target.value })}
            />
          </div>

          <Textarea
            label="Invoice Memo / Notes"
            value={invoiceForm.notes}
            onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
            <Button variant="secondary" onClick={() => setCreateInvoiceModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={actionLoading}>
              Issue Invoice
            </Button>
          </div>
        </form>
      </Modal>

      {/* Record Payment Modal */}
      <Modal
        isOpen={recordPaymentModal}
        onClose={() => setRecordPaymentModal(false)}
        title={`Record Payment for ${selectedInvoice?.invoiceNumber}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs space-y-1">
            <p>
              <strong>Student:</strong> {selectedInvoice?.student?.user?.name}
            </p>
            <p>
              <strong>Current Outstanding Balance:</strong>{' '}
              <span className="text-rose-600 font-bold">${selectedInvoice?.balance}</span>
            </p>
          </div>

          <Input
            label="Payment Amount ($)"
            type="number"
            step="0.01"
            min="1"
            max={selectedInvoice?.balance}
            required
            value={paymentForm.amount}
            onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
          />

          <Select
            label="Payment Method"
            value={paymentForm.paymentMethod}
            onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
          >
            <option value="BANK_TRANSFER">Bank Transfer (ACH / Wire)</option>
            <option value="ONLINE">Online Portal (Card / Gateway)</option>
            <option value="CASH">Cash at Bursar Office</option>
            <option value="CARD">Credit / Debit POS</option>
          </Select>

          <Input
            label="Transaction Reference / Receipt ID"
            required
            value={paymentForm.transactionRef}
            onChange={(e) => setPaymentForm({ ...paymentForm, transactionRef: e.target.value })}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
            <Button variant="secondary" onClick={() => setRecordPaymentModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="success" loading={actionLoading}>
              Reconcile Payment
            </Button>
          </div>
        </form>
      </Modal>

      {/* Printable Receipt Modal */}
      <Modal
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        title="Fee Payment Invoice & Receipt"
        maxWidth="max-w-2xl"
      >
        {selectedInvoice && (
          <div className="space-y-6 printable-area bg-white dark:bg-slate-900 p-2">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-700">
              <div>
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 uppercase">
                  UniManage Institute
                </h3>
                <p className="text-xs text-slate-500 font-mono">Invoice #{selectedInvoice.invoiceNumber}</p>
              </div>
              <StatusBadge status={selectedInvoice.status} />
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-slate-400 font-semibold uppercase text-[10px]">Billed To</p>
                <p className="font-bold text-slate-800 dark:text-slate-100">{selectedInvoice.student?.user?.name}</p>
                <p className="font-mono text-slate-500">Roll No: {selectedInvoice.student?.rollNo}</p>
                <p className="text-slate-500">{selectedInvoice.student?.user?.email}</p>
              </div>
              <div className="text-right">
                <p className="text-slate-400 font-semibold uppercase text-[10px]">Invoice Details</p>
                <p className="text-slate-600 dark:text-slate-400">
                  Issue Date: {new Date(selectedInvoice.createdAt || Date.now()).toLocaleDateString()}
                </p>
                <p className="text-slate-600 dark:text-slate-400">
                  Due Date: {new Date(selectedInvoice.dueDate).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Fee Items Table */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-2 px-3">Item Description</th>
                    <th className="py-2 px-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(selectedInvoice.feeItems || []).map((item) => (
                    <tr key={item.id}>
                      <td className="py-2 px-3 text-slate-800 dark:text-slate-200">{item.title}</td>
                      <td className="py-2 px-3 text-right font-mono">${item.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total Balance Summary */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Total Invoiced:</span>
                <span className="font-mono font-bold">${selectedInvoice.totalAmount}</span>
              </div>
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Total Paid:</span>
                <span className="font-mono">-${selectedInvoice.paidAmount}</span>
              </div>
              <div className="flex justify-between text-rose-600 font-bold pt-2 border-t border-slate-200 dark:border-slate-700">
                <span>Outstanding Balance Due:</span>
                <span className="font-mono">${selectedInvoice.balance}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700 no-print">
              <Button variant="outline" icon={Printer} onClick={handlePrint}>
                Print Receipt
              </Button>
              <Button variant="secondary" onClick={() => setReceiptModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
