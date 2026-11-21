'use client';

import React, { useState } from 'react';
import {
  Receipt,
  FileCheck2,
  Clock,
  AlertCircle,
  Plus,
  Send,
  CreditCard,
  Building,
  UserCheck,
  FileText,
  DollarSign,
  ChevronRight,
  Printer
} from 'lucide-react';

interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  tax: number;
  total: number;
  amountPaid: number;
  balanceDue: number;
  status: 'DRAFT' | 'SENT' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE';
}

interface Quotation {
  id: string;
  quoteNumber: string;
  clientName: string;
  total: number;
  expiryDate: string;
  status: 'SENT' | 'CONVERTED';
}

export default function InvoiceStudio() {
  const [activeTab, setActiveTab] = useState<'INVOICES' | 'CREATE' | 'QUOTES' | 'AGING'>('INVOICES');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Invoices State
  const [invoices, setInvoices] = useState<Invoice[]>([
    {
      id: 'inv-1',
      invoiceNumber: 'INV-2026-1001',
      clientName: 'Acme Global Industries LLC',
      issueDate: '2026-11-01',
      dueDate: '2026-12-01',
      subtotal: 7500.0,
      tax: 618.75,
      total: 8118.75,
      amountPaid: 0.0,
      balanceDue: 8118.75,
      status: 'SENT',
    },
    {
      id: 'inv-2',
      invoiceNumber: 'INV-2026-1002',
      clientName: 'Nexis Technology Partners',
      issueDate: '2026-10-15',
      dueDate: '2026-11-15',
      subtotal: 10000.0,
      tax: 2000.0,
      total: 11500.0,
      amountPaid: 6000.0,
      balanceDue: 5500.0,
      status: 'PARTIALLY_PAID',
    },
    {
      id: 'inv-3',
      invoiceNumber: 'INV-2026-1003',
      clientName: 'Starlight Media Studios',
      issueDate: '2026-09-01',
      dueDate: '2026-10-01',
      subtotal: 3600.0,
      tax: 0.0,
      total: 3600.0,
      amountPaid: 0.0,
      balanceDue: 3600.0,
      status: 'OVERDUE',
    },
    {
      id: 'inv-4',
      invoiceNumber: 'INV-2026-1004',
      clientName: 'Acme Global Industries LLC',
      issueDate: '2026-11-20',
      dueDate: '2026-12-20',
      subtotal: 1800.0,
      tax: 0.0,
      total: 1800.0,
      amountPaid: 0.0,
      balanceDue: 1800.0,
      status: 'DRAFT',
    },
  ]);

  // Quotations State
  const [quotations, setQuotations] = useState<Quotation[]>([
    {
      id: 'qt-1',
      quoteNumber: 'QT-2026-0201',
      clientName: 'Nexis Technology Partners',
      total: 15000.0,
      expiryDate: '2026-12-05',
      status: 'SENT',
    },
  ]);

  // Selected invoice for payment modal
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');

  // New Invoice Form state
  const [newClient, setNewClient] = useState('Acme Global Industries LLC');
  const [itemDesc, setItemDesc] = useState('Senior Enterprise Cloud Architecture Consulting');
  const [itemQty, setItemQty] = useState('20');
  const [itemPrice, setItemPrice] = useState('250.00');
  const [itemTaxRate, setItemTaxRate] = useState('8.25');

  // Computed AR Aging totals
  const totalReceivables = invoices.reduce((sum, inv) => sum + inv.balanceDue, 0);
  const currentReceivables = invoices.filter((i) => i.status === 'SENT').reduce((sum, i) => sum + i.balanceDue, 0);
  const overdueReceivables = invoices.filter((i) => i.status === 'OVERDUE').reduce((sum, i) => sum + i.balanceDue, 0);
  const partialReceivables = invoices.filter((i) => i.status === 'PARTIALLY_PAID').reduce((sum, i) => sum + i.balanceDue, 0);

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    const pmt = parseFloat(paymentAmount);
    if (isNaN(pmt) || pmt <= 0) {
      alert('Please enter a positive payment amount.');
      return;
    }
    if (pmt > selectedInvoice.balanceDue) {
      alert(`Payment of $${pmt.toFixed(2)} exceeds remaining balance due of $${selectedInvoice.balanceDue.toFixed(2)}.`);
      return;
    }

    const updatedPaid = selectedInvoice.amountPaid + pmt;
    const updatedBalance = selectedInvoice.balanceDue - pmt;
    const newStatus = updatedBalance <= 0 ? 'PAID' : 'PARTIALLY_PAID';

    setInvoices(
      invoices.map((inv) =>
        inv.id === selectedInvoice.id
          ? {
              ...inv,
              amountPaid: updatedPaid,
              balanceDue: updatedBalance,
              status: newStatus,
            }
          : inv,
      ),
    );

    setSelectedInvoice(null);
    setPaymentAmount('');
    alert(`Payment of $${pmt.toFixed(2)} recorded. Balance due updated to $${updatedBalance.toFixed(2)}.`);
  };

  const handleCreateDraft = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(itemQty);
    const price = parseFloat(itemPrice);
    const taxRate = parseFloat(itemTaxRate);

    if (isNaN(qty) || isNaN(price) || qty <= 0 || price <= 0) {
      alert('Invalid quantity or price.');
      return;
    }

    const sub = qty * price;
    const tax = sub * (taxRate / 100);
    const total = sub + tax;
    const newNumber = `INV-2026-${1000 + invoices.length + 1}`;

    const newInv: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: newNumber,
      clientName: newClient,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      subtotal: sub,
      tax: tax,
      total: total,
      amountPaid: 0,
      balanceDue: total,
      status: 'DRAFT',
    };

    setInvoices([newInv, ...invoices]);
    setActiveTab('INVOICES');
    alert(`Draft invoice ${newNumber} created successfully!`);
  };

  const handleIssueInvoice = (id: string) => {
    setInvoices(
      invoices.map((inv) => {
        if (inv.id === id) {
          alert(`Invoice ${inv.invoiceNumber} issued to client! Immutable snapshot frozen.`);
          return { ...inv, status: 'SENT' };
        }
        return inv;
      }),
    );
  };

  const handleConvertQuotation = (qId: string) => {
    const quote = quotations.find((q) => q.id === qId);
    if (!quote) return;

    const newInvNum = `INV-2026-${1000 + invoices.length + 1}`;
    const newInv: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: newInvNum,
      clientName: quote.clientName,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      subtotal: quote.total,
      tax: 0,
      total: quote.total,
      amountPaid: 0,
      balanceDue: quote.total,
      status: 'DRAFT',
    };

    setInvoices([newInv, ...invoices]);
    setQuotations(quotations.map((q) => (q.id === qId ? { ...q, status: 'CONVERTED' } : q)));
    alert(`Quotation ${quote.quoteNumber} converted into Draft Invoice ${newInvNum}!`);
  };

  const filteredInvoices =
    statusFilter === 'ALL' ? invoices : invoices.filter((i) => i.status === statusFilter);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 rounded-xl shadow-md text-white">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">Fintrack Invoicing Studio</h1>
              <p className="text-xs text-slate-500">Apex Consulting Solutions Ltd • Accounts Receivable & Billing</p>
            </div>
          </div>

          {/* TABS */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab('INVOICES')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'INVOICES' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Invoices
            </button>
            <button
              onClick={() => setActiveTab('CREATE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                activeTab === 'CREATE' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              New Invoice
            </button>
            <button
              onClick={() => setActiveTab('QUOTES')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'QUOTES' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Quotations
            </button>
            <button
              onClick={() => setActiveTab('AGING')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'AGING' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              AR Aging Report
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* KPI OVERVIEW METRICS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="text-xs font-medium text-slate-500">Total Accounts Receivable</div>
            <div className="text-2xl font-bold text-slate-900 mt-2">
              ${totalReceivables.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-slate-400 mt-1">Outstanding active balances</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="text-xs font-medium text-slate-500">Current (Not Overdue)</div>
            <div className="text-2xl font-bold text-emerald-600 mt-2">
              ${currentReceivables.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-emerald-600 mt-1">Due in 15 - 30 days</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="text-xs font-medium text-slate-500">Partially Paid Balances</div>
            <div className="text-2xl font-bold text-blue-600 mt-2">
              ${partialReceivables.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-slate-400 mt-1">Under active settlement</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="text-xs font-medium text-slate-500">Overdue (31-60 Days)</div>
            <div className="text-2xl font-bold text-rose-600 mt-2">
              ${overdueReceivables.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-rose-600 mt-1">Requires collections follow-up</div>
          </div>
        </div>

        {/* INVOICES LIST VIEW */}
        {activeTab === 'INVOICES' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Commercial Invoices</h2>
                <p className="text-xs text-slate-500">Sequential numbering with frozen immutable snapshots on issuance</p>
              </div>

              {/* Status Filters */}
              <div className="flex items-center gap-1 text-xs">
                {['ALL', 'DRAFT', 'SENT', 'PARTIALLY_PAID', 'OVERDUE'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-md font-medium transition ${
                      statusFilter === st
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Invoices Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-500">
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Client</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4">Total Amount</th>
                    <th className="py-3 px-4">Balance Due</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-4 px-4 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                      <td className="py-4 px-4 font-medium text-slate-800">{inv.clientName}</td>
                      <td className="py-4 px-4 text-slate-500">{inv.dueDate}</td>
                      <td className="py-4 px-4 font-semibold text-slate-900">
                        ${inv.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-4 font-bold text-slate-900">
                        ${inv.balanceDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            inv.status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : inv.status === 'PARTIALLY_PAID'
                              ? 'bg-blue-100 text-blue-800'
                              : inv.status === 'OVERDUE'
                              ? 'bg-rose-100 text-rose-800'
                              : inv.status === 'SENT'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {inv.status === 'DRAFT' && (
                            <button
                              onClick={() => handleIssueInvoice(inv.id)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 shadow-sm"
                            >
                              <Send className="w-3 h-3" />
                              Issue
                            </button>
                          )}
                          {inv.balanceDue > 0 && inv.status !== 'DRAFT' && (
                            <button
                              onClick={() => {
                                setSelectedInvoice(inv);
                                setPaymentAmount(inv.balanceDue.toFixed(2));
                              }}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 shadow-sm"
                            >
                              <CreditCard className="w-3 h-3" />
                              Pay
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CREATE DRAFT INVOICE VIEW */}
        {activeTab === 'CREATE' && (
          <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm max-w-3xl mx-auto space-y-6">
            <div className="border-b pb-4">
              <h2 className="text-lg font-bold text-slate-900">Create New Commercial Invoice</h2>
              <p className="text-xs text-slate-500">Atomic sequential number will be allocated on creation</p>
            </div>

            <form onSubmit={handleCreateDraft} className="space-y-6 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Select Client</label>
                <select
                  value={newClient}
                  onChange={(e) => setNewClient(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Acme Global Industries LLC">Acme Global Industries LLC</option>
                  <option value="Nexis Technology Partners">Nexis Technology Partners</option>
                  <option value="Starlight Media Studios">Starlight Media Studios</option>
                </select>
              </div>

              <div className="p-4 border rounded-lg bg-slate-50 space-y-4">
                <div className="font-semibold text-slate-900">Line Item Details</div>
                <div>
                  <label className="block text-slate-600 mb-1">Description</label>
                  <input
                    type="text"
                    value={itemDesc}
                    onChange={(e) => setItemDesc(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-slate-600 mb-1">Quantity</label>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      value={itemQty}
                      onChange={(e) => setItemQty(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Unit Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={itemPrice}
                      onChange={(e) => setItemPrice(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Tax Rate</label>
                    <select
                      value={itemTaxRate}
                      onChange={(e) => setItemTaxRate(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="0.00">Zero Tax (0%)</option>
                      <option value="8.25">Sales Tax (8.25%)</option>
                      <option value="20.00">Standard VAT (20%)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setActiveTab('INVOICES')}
                  className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-sm transition"
                >
                  Save Draft Invoice
                </button>
              </div>
            </form>
          </div>
        )}

        {/* QUOTATIONS VIEW */}
        {activeTab === 'QUOTES' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Estimates & Quotations</h2>
              <p className="text-xs text-slate-500">Create client quotes and convert directly into draft invoices</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500">
                    <th className="py-3 px-4">Quote #</th>
                    <th className="py-3 px-4">Client</th>
                    <th className="py-3 px-4">Total Amount</th>
                    <th className="py-3 px-4">Expiry Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Convert</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {quotations.map((q) => (
                    <tr key={q.id} className="hover:bg-slate-50/60">
                      <td className="py-4 px-4 font-mono font-bold text-slate-900">{q.quoteNumber}</td>
                      <td className="py-4 px-4 text-slate-800 font-medium">{q.clientName}</td>
                      <td className="py-4 px-4 font-semibold text-slate-900">
                        ${q.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-4 text-slate-500">{q.expiryDate}</td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            q.status === 'CONVERTED' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {q.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        {q.status !== 'CONVERTED' && (
                          <button
                            onClick={() => handleConvertQuotation(q.id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-semibold shadow-sm"
                          >
                            Convert to Invoice
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* AGING REPORT VIEW */}
        {activeTab === 'AGING' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Accounts Receivable Aging Report</h2>
              <p className="text-xs text-slate-500">Categorized receivables aging buckets for credit and cashflow surveillance</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="bg-white border rounded-xl p-4 shadow-sm text-center">
                <div className="text-xs text-slate-500 font-medium">Current (Not Due)</div>
                <div className="text-xl font-bold text-slate-900 mt-2">${currentReceivables.toFixed(2)}</div>
                <div className="text-[10px] text-emerald-600 font-semibold mt-1">Healthy</div>
              </div>

              <div className="bg-white border rounded-xl p-4 shadow-sm text-center">
                <div className="text-xs text-slate-500 font-medium">1 - 30 Days Overdue</div>
                <div className="text-xl font-bold text-slate-900 mt-2">$0.00</div>
                <div className="text-[10px] text-slate-400 font-semibold mt-1">0 Invoices</div>
              </div>

              <div className="bg-white border border-rose-200 bg-rose-50/20 rounded-xl p-4 shadow-sm text-center">
                <div className="text-xs text-rose-700 font-medium">31 - 60 Days Overdue</div>
                <div className="text-xl font-bold text-rose-600 mt-2">${overdueReceivables.toFixed(2)}</div>
                <div className="text-[10px] text-rose-600 font-semibold mt-1">1 Invoice (INV-1003)</div>
              </div>

              <div className="bg-white border rounded-xl p-4 shadow-sm text-center">
                <div className="text-xs text-slate-500 font-medium">61 - 90 Days Overdue</div>
                <div className="text-xl font-bold text-slate-900 mt-2">$0.00</div>
                <div className="text-[10px] text-slate-400 font-semibold mt-1">0 Invoices</div>
              </div>

              <div className="bg-white border rounded-xl p-4 shadow-sm text-center">
                <div className="text-xs text-slate-500 font-medium">90+ Days Overdue</div>
                <div className="text-xl font-bold text-slate-900 mt-2">$0.00</div>
                <div className="text-[10px] text-slate-400 font-semibold mt-1">0 Invoices</div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* RECORD PAYMENT MODAL */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-slate-900">Record Payment for {selectedInvoice.invoiceNumber}</h3>
              <button onClick={() => setSelectedInvoice(null)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div className="space-y-1">
              <div className="text-slate-500">Client: <span className="font-semibold text-slate-800">{selectedInvoice.clientName}</span></div>
              <div className="text-slate-500">Remaining Balance Due: <span className="font-bold text-slate-900">${selectedInvoice.balanceDue.toFixed(2)}</span></div>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4 pt-2">
              <div>
                <label className="block text-slate-600 mb-1">Payment Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={selectedInvoice.balanceDue}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="px-3 py-1.5 border rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-sm"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        Fintrack Invoice Management System • Independent System 05 • Immutable Accounting Engine
      </footer>
    </div>
  );
}
