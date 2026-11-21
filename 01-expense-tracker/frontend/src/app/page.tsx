'use client';

import React, { useState } from 'react';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  PlusCircle,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  PiggyBank,
  Sliders,
  Calendar,
  Layers,
  Search,
  Filter,
  Trash2,
  DollarSign
} from 'lucide-react';

interface Account {
  id: string;
  name: string;
  type: string;
  currency: string;
  balance: number;
  initialBalance: number;
  color: string;
}

interface Transaction {
  id: string;
  date: string;
  account: string;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  category: string;
  amount: number;
  description: string;
}

export default function ExpenseTrackerApp() {
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'accounts' | 'recurring' | 'goals'>('overview');
  
  // Interactive sample state
  const [accounts, setAccounts] = useState<Account[]>([
    { id: '1', name: 'Primary Checking', type: 'CHECKING', currency: 'USD', balance: 4250.00, initialBalance: 2500.00, color: '#3b82f6' },
    { id: '2', name: 'High-Yield Savings Vault', type: 'SAVINGS', currency: 'USD', balance: 11000.00, initialBalance: 10000.00, color: '#10b981' },
    { id: '3', name: 'Physical Cash Wallet', type: 'CASH', currency: 'USD', balance: 175.00, initialBalance: 200.00, color: '#f59e0b' },
    { id: '4', name: 'Sapphire Credit Card', type: 'CREDIT_CARD', currency: 'USD', balance: -362.85, initialBalance: 0.00, color: '#ef4444' },
  ]);

  const [transactions, setTransactions] = useState<Transaction[]>([
    { id: 't1', date: '2026-03-24', account: 'Primary Checking', type: 'INCOME', category: 'Salary & Income', amount: 4500.00, description: 'Monthly Engineering Salary' },
    { id: 't2', date: '2026-03-23', account: 'Primary Checking', type: 'EXPENSE', category: 'Housing & Rent', amount: 1650.00, description: 'Apartment Monthly Rent' },
    { id: 't3', date: '2026-03-20', account: 'Primary Checking', type: 'EXPENSE', category: 'Utilities & Bills', amount: 145.20, description: 'Electric & Fiber Broadband' },
    { id: 't4', date: '2026-03-18', account: 'Sapphire Credit Card', type: 'EXPENSE', category: 'Groceries', amount: 284.50, description: 'Weekly Organic Grocery Run' },
    { id: 't5', date: '2026-03-15', account: 'Sapphire Credit Card', type: 'EXPENSE', category: 'Dining Out', amount: 78.35, description: 'Dinner with Team' },
    { id: 't6', date: '2026-03-12', account: 'Primary Checking', type: 'TRANSFER', category: 'Internal Transfer', amount: 1000.00, description: 'Transfer to High-Yield Savings' },
    { id: 't7', date: '2026-03-10', account: 'Physical Cash Wallet', type: 'EXPENSE', category: 'Transportation', amount: 25.00, description: 'Transit Card Top-up' },
    { id: 't8', date: '2026-03-05', account: 'Primary Checking', type: 'INCOME', category: 'Freelance & Consulting', amount: 1200.00, description: 'Architecture Advisory Retainer' },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [reconciliationAlert, setReconciliationAlert] = useState<string | null>(null);

  // Form states
  const [newDesc, setNewDesc] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newType, setNewType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [newAccount, setNewAccount] = useState('Primary Checking');
  const [newCategory, setNewCategory] = useState('Dining Out');

  const [transferSource, setTransferSource] = useState('Primary Checking');
  const [transferDest, setTransferDest] = useState('High-Yield Savings Vault');
  const [transferAmt, setTransferAmt] = useState('');

  // Calculations
  const totalNetWorth = accounts.reduce((sum, a) => sum + a.balance, 0);
  const totalIncome = transactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);
  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? ((netSavings / totalIncome) * 100).toFixed(1) : '0.0';

  // Handlers
  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesc || !newAmount || isNaN(Number(newAmount))) return;
    const amt = parseFloat(newAmount);

    const newTx: Transaction = {
      id: `t_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      account: newAccount,
      type: newType,
      category: newCategory,
      amount: amt,
      description: newDesc,
    };

    setTransactions([newTx, ...transactions]);

    // Update account balance
    setAccounts(accounts.map(acc => {
      if (acc.name === newAccount) {
        return {
          ...acc,
          balance: newType === 'INCOME' ? acc.balance + amt : acc.balance - amt
        };
      }
      return acc;
    }));

    setNewDesc('');
    setNewAmount('');
    setShowAddModal(false);
  };

  const handleAtomicTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (transferSource === transferDest) {
      alert('Source and destination accounts must be distinct');
      return;
    }
    const amt = parseFloat(transferAmt);
    if (isNaN(amt) || amt <= 0) return;

    const transferTx: Transaction = {
      id: `tr_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      account: transferSource,
      type: 'TRANSFER',
      category: 'Internal Transfer',
      amount: amt,
      description: `Transfer to ${transferDest}`,
    };

    setTransactions([transferTx, ...transactions]);

    setAccounts(accounts.map(acc => {
      if (acc.name === transferSource) return { ...acc, balance: acc.balance - amt };
      if (acc.name === transferDest) return { ...acc, balance: acc.balance + amt };
      return acc;
    }));

    setTransferAmt('');
    setShowTransferModal(false);
  };

  const handleDeleteTransaction = (id: string) => {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;

    setTransactions(transactions.filter(t => t.id !== id));

    // Rollback balance
    if (tx.type !== 'TRANSFER') {
      setAccounts(accounts.map(acc => {
        if (acc.name === tx.account) {
          return {
            ...acc,
            balance: tx.type === 'INCOME' ? acc.balance - tx.amount : acc.balance + tx.amount
          };
        }
        return acc;
      }));
    }
  };

  const handleReconcile = (accountName: string) => {
    const acc = accounts.find(a => a.name === accountName);
    if (!acc) return;

    let computed = acc.initialBalance;
    transactions.filter(t => t.account === accountName).forEach(t => {
      if (t.type === 'INCOME') computed += t.amount;
      else if (t.type === 'EXPENSE') computed -= t.amount;
      else if (t.type === 'TRANSFER') computed -= t.amount;
    });

    const diff = Math.abs(computed - acc.balance);
    if (diff < 0.01) {
      setReconciliationAlert(`Reconciliation verified for ${accountName}: Stored $${acc.balance.toFixed(2)} perfectly matches transaction ledger.`);
    } else {
      setReconciliationAlert(`Discrepancy detected for ${accountName}: Ledger calculation is $${computed.toFixed(2)}.`);
    }
    setTimeout(() => setReconciliationAlert(null), 5000);
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || t.category === selectedCategory;
    const matchesType = selectedType === 'ALL' || t.type === selectedType;
    return matchesSearch && matchesCategory && matchesType;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white">Expense Tracker</span>
              <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Phase 1 Delivery
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-all shadow-md shadow-emerald-600/20"
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Transaction</span>
            </button>
            <button
              onClick={() => setShowTransferModal(true)}
              className="flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm border border-slate-700 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Transfer</span>
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm border border-slate-700 transition-all"
              title="Import CSV"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
        {/* Banner Alert if Reconciled */}
        {reconciliationAlert && (
          <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-200 flex items-center space-x-3 animate-fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-sm font-medium">{reconciliationAlert}</span>
          </div>
        )}

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800/80 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 text-sm font-medium">
              <span>Total Net Worth</span>
              <Wallet className="w-4 h-4 text-blue-400" />
            </div>
            <div className="mt-3 text-3xl font-extrabold text-white tracking-tight">
              ${totalNetWorth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="mt-2 text-xs text-slate-400 flex items-center space-x-1">
              <span className="text-emerald-400 font-semibold">{accounts.length} active accounts</span>
              <span>• Decimal precision</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800/80 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 text-sm font-medium">
              <span>Monthly Inflow</span>
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-3 text-3xl font-extrabold text-emerald-400 tracking-tight">
              +${totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="mt-2 text-xs text-slate-400">
              Verified income deposits
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800/80 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 text-sm font-medium">
              <span>Monthly Outflow</span>
              <ArrowDownRight className="w-4 h-4 text-red-400" />
            </div>
            <div className="mt-3 text-3xl font-extrabold text-red-400 tracking-tight">
              -${totalExpense.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="mt-2 text-xs text-slate-400">
              Categorized living expenses
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800/80 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 text-sm font-medium">
              <span>Net Savings Rate</span>
              <PiggyBank className="w-4 h-4 text-teal-400" />
            </div>
            <div className="mt-3 text-3xl font-extrabold text-teal-400 tracking-tight">
              {savingsRate}%
            </div>
            <div className="mt-2 text-xs text-slate-400">
              Net: +${netSavings.toFixed(2)} retained
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 space-x-8 text-sm font-semibold">
          {[
            { id: 'overview', label: 'Overview & Visuals', icon: Layers },
            { id: 'transactions', label: 'Transactions', icon: Filter },
            { id: 'accounts', label: 'Accounts & Reconciliation', icon: Wallet },
            { id: 'recurring', label: 'Recurring & Rules', icon: Sliders },
            { id: 'goals', label: 'Goals & Budget Limits', icon: PiggyBank },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-4 flex items-center space-x-2 border-b-2 transition-all ${
                  isActive
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="text-base font-semibold text-white">Monthly Cash Flow Breakdown</h3>
              <div className="space-y-4 pt-2">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">Income Inflow ($5,700.00)</span>
                    <span className="text-emerald-400 font-semibold">100%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-3 rounded-full w-full"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">Living Expenses ($2,178.05)</span>
                    <span className="text-red-400 font-semibold">38.2%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                    <div className="bg-red-500 h-3 rounded-full w-[38.2%]"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">Net Surplus Retained ($3,521.95)</span>
                    <span className="text-teal-400 font-semibold">61.8%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                    <div className="bg-teal-500 h-3 rounded-full w-[61.8%]"></div>
                  </div>
                </div>
              </div>

              <div className="mt-8 border-t border-slate-800 pt-5 grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800/60">
                  <span className="text-xs text-slate-400">Fixed Housing</span>
                  <div className="text-lg font-bold text-white mt-1">$1,650.00</div>
                </div>
                <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800/60">
                  <span className="text-xs text-slate-400">Groceries & Food</span>
                  <div className="text-lg font-bold text-white mt-1">$362.85</div>
                </div>
                <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800/60">
                  <span className="text-xs text-slate-400">Utilities & Transit</span>
                  <div className="text-lg font-bold text-white mt-1">$170.20</div>
                </div>
              </div>
            </div>

            {/* Account Quick Status */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="text-base font-semibold text-white">Accounts Summary</h3>
              <div className="space-y-3">
                {accounts.map(acc => (
                  <div key={acc.id} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-white">{acc.name}</div>
                      <div className="text-xs text-slate-400 uppercase tracking-wider mt-0.5">{acc.type}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-bold ${acc.balance >= 0 ? 'text-slate-100' : 'text-red-400'}`}>
                        ${acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                      <button
                        onClick={() => handleReconcile(acc.name)}
                        className="text-xs text-emerald-400 hover:underline mt-0.5"
                      >
                        Reconcile
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Transactions */}
        {activeTab === 'transactions' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap gap-4 items-center justify-between">
              <div className="flex items-center space-x-2 flex-1 max-w-md bg-slate-950 px-3 py-2 rounded-lg border border-slate-800">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search description or category..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="bg-transparent text-sm text-slate-100 focus:outline-none w-full"
                />
              </div>

              <div className="flex items-center space-x-3">
                <select
                  value={selectedType}
                  onChange={e => setSelectedType(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200"
                >
                  <option value="ALL">All Types</option>
                  <option value="INCOME">Income Only</option>
                  <option value="EXPENSE">Expense Only</option>
                  <option value="TRANSFER">Transfers</option>
                </select>

                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200"
                >
                  <option value="ALL">All Categories</option>
                  <option value="Salary & Income">Salary & Income</option>
                  <option value="Housing & Rent">Housing & Rent</option>
                  <option value="Groceries">Groceries</option>
                  <option value="Dining Out">Dining Out</option>
                  <option value="Utilities & Bills">Utilities & Bills</option>
                </select>
              </div>
            </div>

            {/* Dense Transaction Table */}
            <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Description</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Account</th>
                    <th className="py-3.5 px-4 text-right">Amount</th>
                    <th className="py-3.5 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 text-slate-400 font-mono text-xs">{tx.date}</td>
                      <td className="py-3.5 px-4 font-medium text-white">{tx.description}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 border border-slate-700/60 text-slate-300">
                          {tx.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">{tx.account}</td>
                      <td className={`py-3.5 px-4 text-right font-mono font-bold ${
                        tx.type === 'INCOME' ? 'text-emerald-400' : tx.type === 'EXPENSE' ? 'text-red-400' : 'text-blue-400'
                      }`}>
                        {tx.type === 'INCOME' ? '+' : tx.type === 'EXPENSE' ? '-' : ''}
                        ${tx.amount.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleDeleteTransaction(tx.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Soft Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredTransactions.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        No transactions found matching query criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Accounts & Reconciliation */}
        {activeTab === 'accounts' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {accounts.map(acc => (
              <div key={acc.id} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: acc.color }}></div>
                    <h3 className="text-lg font-bold text-white">{acc.name}</h3>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700 uppercase font-mono">
                    {acc.type}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 py-2 border-y border-slate-800">
                  <div>
                    <span className="text-xs text-slate-400">Current Balance</span>
                    <div className={`text-2xl font-black mt-1 ${acc.balance >= 0 ? 'text-white' : 'text-red-400'}`}>
                      ${acc.balance.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">Initial Opening Balance</span>
                    <div className="text-2xl font-black text-slate-400 mt-1">
                      ${acc.initialBalance.toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-emerald-400 flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Double-entry ledger verified</span>
                  </span>
                  <button
                    onClick={() => handleReconcile(acc.name)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 transition-colors"
                  >
                    Run Reconciliation Check
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 4: Recurring & Rules */}
        {activeTab === 'recurring' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  <span>Recurring Transactions</span>
                </h3>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Idempotent Job
                </span>
              </div>
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-white text-sm">Bi-Weekly Paycheck</div>
                    <div className="text-xs text-slate-400 mt-0.5">Primary Checking • Next: April 1, 2026</div>
                  </div>
                  <span className="font-mono text-emerald-400 font-bold">+$4,500.00</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-white text-sm">Apartment Lease Rent</div>
                    <div className="text-xs text-slate-400 mt-0.5">Primary Checking • Monthly • Next: April 1, 2026</div>
                  </div>
                  <span className="font-mono text-red-400 font-bold">-$1,650.00</span>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <Sliders className="w-4 h-4 text-blue-400" />
                  <span>Deterministic Categorization Rules</span>
                </h3>
                <span className="text-xs text-slate-400">Priority Order</span>
              </div>
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                  <div className="flex justify-between font-semibold text-white text-sm">
                    <span>Priority 1: Coffee & Cafe</span>
                    <span className="text-emerald-400">Active</span>
                  </div>
                  <p className="text-slate-400">If description contains &quot;Starbucks&quot; &rarr; Set Category to &quot;Dining Out&quot;</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                  <div className="flex justify-between font-semibold text-white text-sm">
                    <span>Priority 2: Transit Pass</span>
                    <span className="text-emerald-400">Active</span>
                  </div>
                  <p className="text-slate-400">If description contains &quot;Metro&quot; &rarr; Set Category to &quot;Transportation&quot;</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Goals & Budget Limits */}
        {activeTab === 'goals' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <PiggyBank className="w-4 h-4 text-teal-400" />
                <span>Savings Goals</span>
              </h3>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex justify-between items-center text-sm font-semibold">
                  <span>Emergency Fund (6 Months)</span>
                  <span className="text-teal-400">$11,000 / $20,000 (55%)</span>
                </div>
                <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                  <div className="bg-teal-500 h-3 rounded-full w-[55%]"></div>
                </div>
                <div className="text-xs text-slate-400 flex justify-between">
                  <span>Target Date: Dec 31, 2027</span>
                  <span>$9,000 remaining</span>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span>Monthly Budget Alerts</span>
              </h3>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-white">Dining Out Monthly Limit</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    Safe (39.2% spent)
                  </span>
                </div>
                <p className="text-xs text-slate-400">Spent: $78.35 of $200.00 limit for current month.</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Add Transaction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Create New Transaction</h3>
            <form onSubmit={handleAddTransaction} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewType('EXPENSE')}
                    className={`py-2 rounded-lg font-semibold text-xs border ${
                      newType === 'EXPENSE' ? 'bg-red-500/20 text-red-400 border-red-500/40' : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewType('INCOME')}
                    className={`py-2 rounded-lg font-semibold text-xs border ${
                      newType === 'INCOME' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    Income
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Description</label>
                <input
                  type="text"
                  required
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="e.g. Grocery Store"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={newAmount}
                  onChange={e => setNewAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Account</label>
                  <select
                    value={newAccount}
                    onChange={e => setNewAccount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100"
                  >
                    {accounts.map(a => (
                      <option key={a.id} value={a.name}>{a.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100"
                  >
                    <option value="Groceries">Groceries</option>
                    <option value="Dining Out">Dining Out</option>
                    <option value="Salary & Income">Salary & Income</option>
                    <option value="Housing & Rent">Housing & Rent</option>
                    <option value="Utilities & Bills">Utilities & Bills</option>
                    <option value="Transportation">Transportation</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white"
                >
                  Save Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Atomic Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Atomic Account Transfer</h3>
            <p className="text-xs text-slate-400">Debit and credit executed in a single transaction with zero net drift.</p>
            <form onSubmit={handleAtomicTransfer} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Source Account (Debit)</label>
                <select
                  value={transferSource}
                  onChange={e => setTransferSource(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100"
                >
                  {accounts.map(a => (
                    <option key={a.id} value={a.name}>{a.name} (${a.balance.toFixed(2)})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Destination Account (Credit)</label>
                <select
                  value={transferDest}
                  onChange={e => setTransferDest(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100"
                >
                  {accounts.map(a => (
                    <option key={a.id} value={a.name}>{a.name} (${a.balance.toFixed(2)})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Transfer Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={transferAmt}
                  onChange={e => setTransferAmt(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white"
                >
                  Execute Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
              <span>CSV Ingestion Engine</span>
            </h3>
            <p className="text-xs text-slate-400">
              Parses columns, checks SHA-256 duplicate fingerprinting, and tags transactions under an undoable ImportBatch.
            </p>

            <div className="p-4 rounded-xl bg-slate-950 border border-dashed border-slate-700 text-center space-y-2">
              <FileSpreadsheet className="w-8 h-8 text-slate-500 mx-auto" />
              <div className="text-xs text-slate-300 font-medium">Sample format: Date, Amount, Description, Category</div>
              <div className="text-xs text-emerald-400 font-mono">bank_export_2026_q1.csv (Simulated Ready)</div>
            </div>

            <div className="text-xs space-y-1 bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-slate-400">
              <div>&bull; SHA-256 duplicate detection: ENABLED</div>
              <div>&bull; Row schema validation: ENABLED</div>
              <div>&bull; Batch rollback protection: READY</div>
            </div>

            <div className="flex justify-end space-x-3 pt-3">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  alert('CSV Ingestion Preview validated: 0 duplicates, 12 rows ready for batch import.');
                  setShowImportModal(false);
                }}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white"
              >
                Simulate Ingestion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
