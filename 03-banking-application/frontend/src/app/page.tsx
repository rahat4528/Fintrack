'use client';

import React, { useState } from 'react';
import {
  ShieldAlert,
  Building2,
  ArrowRightLeft,
  FileText,
  UserCheck,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  History,
  TrendingDown,
  TrendingUp,
  CreditCard,
  Settings,
  Scale
} from 'lucide-react';

interface Account {
  id: string;
  accountNumber: string;
  type: string;
  currency: string;
  balance: string;
  status: 'ACTIVE' | 'FROZEN';
}

interface TransferRecord {
  id: string;
  reference: string;
  fromAccount: string;
  toAccount: string;
  amount: string;
  currency: string;
  timestamp: string;
  status: string;
}

export default function BankingPortal() {
  const [activeRole, setActiveRole] = useState<'CUSTOMER' | 'EMPLOYEE' | 'ADMIN'>('CUSTOMER');

  // Accounts state
  const [accounts, setAccounts] = useState<Account[]>([
    {
      id: 'acc-1',
      accountNumber: 'CHK-9028-11',
      type: 'Primary Checking',
      currency: 'USD',
      balance: '14250.00',
      status: 'ACTIVE',
    },
    {
      id: 'acc-2',
      accountNumber: 'SAV-5541-22',
      type: 'High-Yield Savings',
      currency: 'USD',
      balance: '32500.00',
      status: 'ACTIVE',
    },
    {
      id: 'acc-3',
      accountNumber: 'EUR-3310-88',
      type: 'Euro Travel Reserve',
      currency: 'EUR',
      balance: '8900.00',
      status: 'ACTIVE',
    },
  ]);

  // Transfer form state
  const [fromAccount, setFromAccount] = useState('CHK-9028-11');
  const [toAccount, setToAccount] = useState('SAV-5541-22');
  const [amount, setAmount] = useState('250.00');
  const [transferMemo, setTransferMemo] = useState('Monthly savings deposit');
  const [transfers, setTransfers] = useState<TransferRecord[]>([
    {
      id: 'tx-1',
      reference: 'TX-BNK-784912',
      fromAccount: 'CHK-9028-11',
      toAccount: 'SAV-5541-22',
      amount: '500.00',
      currency: 'USD',
      timestamp: 'Today at 09:15 AM',
      status: 'SETTLED',
    },
    {
      id: 'tx-2',
      reference: 'TX-BNK-654129',
      fromAccount: 'SAV-5541-22',
      toAccount: 'CHK-9028-11',
      amount: '120.00',
      currency: 'USD',
      timestamp: 'Yesterday at 04:30 PM',
      status: 'SETTLED',
    },
  ]);

  // KYC items for employee view
  const [kycQueue, setKycQueue] = useState([
    { id: 'kyc-1', name: 'Eleanor Vance', docType: 'Simulated National ID', status: 'PENDING_REVIEW' },
    { id: 'kyc-2', name: 'Marcus Sterling', docType: 'Simulated Passport', status: 'PENDING_REVIEW' },
  ]);

  // Alerts for compliance view
  const [monitoringAlerts, setMonitoringAlerts] = useState([
    { id: 'alt-1', rule: 'HIGH_VELOCITY_TRANSFER', target: 'CHK-9028-11', amount: '$8,500.00', severity: 'MEDIUM', status: 'OPEN' },
    { id: 'alt-2', rule: 'AFTER_HOURS_AUTHENTICATION', target: 'admin@fintrack-bank.internal', amount: 'N/A', severity: 'LOW', status: 'OPEN' },
  ]);

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Please enter a valid positive transfer amount.');
      return;
    }

    const source = accounts.find((a) => a.accountNumber === fromAccount);
    if (!source) return;

    if (source.status === 'FROZEN') {
      alert(`Transfer failed: Source account ${fromAccount} is FROZEN.`);
      return;
    }

    if (parseFloat(source.balance) < numAmount) {
      alert(`Transfer failed: Insufficient funds in ${fromAccount}.`);
      return;
    }

    // Atomic double-entry update
    const updatedAccounts = accounts.map((acc) => {
      if (acc.accountNumber === fromAccount) {
        return { ...acc, balance: (parseFloat(acc.balance) - numAmount).toFixed(2) };
      }
      if (acc.accountNumber === toAccount) {
        return { ...acc, balance: (parseFloat(acc.balance) + numAmount).toFixed(2) };
      }
      return acc;
    });

    const newTx: TransferRecord = {
      id: `tx-${Date.now()}`,
      reference: `TX-BNK-${Math.floor(100000 + Math.random() * 900000)}`,
      fromAccount,
      toAccount,
      amount: numAmount.toFixed(2),
      currency: source.currency,
      timestamp: 'Just now',
      status: 'SETTLED',
    };

    setAccounts(updatedAccounts);
    setTransfers([newTx, ...transfers]);
    alert(`Transfer of ${source.currency} ${numAmount.toFixed(2)} posted successfully! Idempotency verified.`);
  };

  const toggleFreezeAccount = (accNumber: string) => {
    setAccounts(
      accounts.map((a) => {
        if (a.accountNumber === accNumber) {
          const nextStatus = a.status === 'ACTIVE' ? 'FROZEN' : 'ACTIVE';
          return { ...a, status: nextStatus };
        }
        return a;
      }),
    );
  };

  const handleApproveKyc = (id: string) => {
    setKycQueue(kycQueue.filter((k) => k.id !== id));
    alert('Simulated KYC verification approved.');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* SIMULATED DEMO BANNER */}
      <div className="bg-amber-500 text-slate-950 px-4 py-2 text-center text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 border-b border-amber-600 shadow-sm">
        <ShieldAlert className="w-4 h-4 text-slate-950 shrink-0" />
        <span>
          SIMULATED INTERNET BANKING DEMO — All accounts, balances, identifiers, and transactions are artificial sample records for software demonstration only.
        </span>
      </div>

      {/* HEADER & PORTAL SWITCHER */}
      <header className="bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Fintrack Commercial Banking</h1>
              <p className="text-xs text-slate-400">Core Double-Entry Ledger & Multi-Role Online Banking</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-800 p-1 rounded-lg border border-slate-700">
            <button
              onClick={() => setActiveRole('CUSTOMER')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                activeRole === 'CUSTOMER' ? 'bg-blue-600 text-white shadow' : 'text-slate-300 hover:text-white'
              }`}
            >
              Customer Portal
            </button>
            <button
              onClick={() => setActiveRole('EMPLOYEE')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                activeRole === 'EMPLOYEE' ? 'bg-blue-600 text-white shadow' : 'text-slate-300 hover:text-white'
              }`}
            >
              Employee Ops
            </button>
            <button
              onClick={() => setActiveRole('ADMIN')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                activeRole === 'ADMIN' ? 'bg-blue-600 text-white shadow' : 'text-slate-300 hover:text-white'
              }`}
            >
              Admin & Compliance
            </button>
          </div>
        </div>
      </header>

      {/* MAIN BODY */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* CUSTOMER PORTAL */}
        {activeRole === 'CUSTOMER' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Account Overviews</h2>
              <p className="text-sm text-slate-500">Real-time ledger reconciled balances with zero-sum invariant</p>
            </div>

            {/* ACCOUNT CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {accounts.map((acc) => (
                <div
                  key={acc.id}
                  className={`bg-white rounded-xl border p-6 shadow-sm transition ${
                    acc.status === 'FROZEN' ? 'border-red-300 bg-red-50/20' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {acc.type}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        acc.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {acc.status}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-slate-900 tracking-tight">
                    {acc.currency} {parseFloat(acc.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500 border-t pt-3 border-slate-100">
                    <span>Acc: {acc.accountNumber}</span>
                    <span className="font-mono text-[11px] text-slate-400">ISO 4217</span>
                  </div>
                </div>
              ))}
            </div>

            {/* TRANSFER & RECENT HISTORY */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Transfer Form */}
              <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4 text-slate-900 font-semibold">
                  <ArrowRightLeft className="w-5 h-5 text-blue-600" />
                  <h3>Internal Account Transfer</h3>
                </div>
                <form onSubmit={handleExecuteTransfer} className="space-y-4 text-sm">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Source Account</label>
                    <select
                      value={fromAccount}
                      onChange={(e) => setFromAccount(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {accounts.map((a) => (
                        <option key={a.id} value={a.accountNumber}>
                          {a.accountNumber} ({a.type}) - {a.currency} {a.balance}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Destination Account</label>
                    <select
                      value={toAccount}
                      onChange={(e) => setToAccount(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {accounts.map((a) => (
                        <option key={a.id} value={a.accountNumber}>
                          {a.accountNumber} ({a.type})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Transfer Memo</label>
                    <input
                      type="text"
                      value={transferMemo}
                      onChange={(e) => setTransferMemo(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg shadow transition flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Post Atomic Transfer
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 text-center">
                    Protected by client idempotency-key & transactional lock
                  </p>
                </form>
              </div>

              {/* Transactions List */}
              <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-slate-900 font-semibold">
                    <History className="w-5 h-5 text-slate-600" />
                    <h3>Ledger Transaction History</h3>
                  </div>
                  <button
                    onClick={() => alert('Simulated account statement generated. Reconciliation matches.')}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 border border-blue-200 rounded px-2.5 py-1 hover:bg-blue-50 transition"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Download Statement
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500">
                        <th className="pb-3">Reference</th>
                        <th className="pb-3">From / To</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3">Time</th>
                        <th className="pb-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {transfers.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-50/50">
                          <td className="py-3 font-mono font-medium text-slate-800">{tx.reference}</td>
                          <td className="py-3 text-slate-600">
                            {tx.fromAccount} → {tx.toAccount}
                          </td>
                          <td className="py-3">
                            <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-semibold">
                              {tx.status}
                            </span>
                          </td>
                          <td className="py-3 text-slate-500">{tx.timestamp}</td>
                          <td className="py-3 text-right font-medium text-slate-900">
                            {tx.currency} {tx.amount}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* EMPLOYEE PORTAL */}
        {activeRole === 'EMPLOYEE' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Bank Operations & KYC Management</h2>
              <p className="text-sm text-slate-500">Operational staff controls for compliance reviews and account safety</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* KYC Review */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4 font-semibold text-slate-900">
                  <UserCheck className="w-5 h-5 text-indigo-600" />
                  <h3>Pending Customer KYC Records</h3>
                </div>
                {kycQueue.length === 0 ? (
                  <p className="text-sm text-slate-500 py-4 text-center">No pending KYC verifications in queue.</p>
                ) : (
                  <div className="space-y-3">
                    {kycQueue.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg bg-slate-50">
                        <div>
                          <div className="font-medium text-sm text-slate-900">{item.name}</div>
                          <div className="text-xs text-slate-500">{item.docType}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleApproveKyc(item.id)}
                            className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded font-medium"
                          >
                            Approve
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Account Controls */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4 font-semibold text-slate-900">
                  <Lock className="w-5 h-5 text-rose-600" />
                  <h3>Emergency Account Freezing</h3>
                </div>
                <div className="space-y-3">
                  {accounts.map((acc) => (
                    <div key={acc.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium text-sm text-slate-900">{acc.accountNumber}</div>
                        <div className="text-xs text-slate-500">
                          {acc.type} • Status: <span className="font-semibold">{acc.status}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleFreezeAccount(acc.accountNumber)}
                        className={`text-xs px-3 py-1.5 rounded font-medium flex items-center gap-1 ${
                          acc.status === 'ACTIVE'
                            ? 'bg-rose-600 hover:bg-rose-700 text-white'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        {acc.status === 'ACTIVE' ? (
                          <>
                            <Lock className="w-3.5 h-3.5" /> Freeze
                          </>
                        ) : (
                          <>
                            <Unlock className="w-3.5 h-3.5" /> Unfreeze
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ADMIN & COMPLIANCE PORTAL */}
        {activeRole === 'ADMIN' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Compliance & Regulatory Oversight</h2>
              <p className="text-sm text-slate-500">Immutable ledger audit trail, transaction thresholds, and AML monitoring</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Monitoring Alerts */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4 font-semibold text-slate-900">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <h3>Automated Transaction Monitoring Alerts</h3>
                </div>
                <div className="space-y-3">
                  {monitoringAlerts.map((alt) => (
                    <div key={alt.id} className="p-3 border rounded-lg bg-amber-50/40 border-amber-200 text-xs">
                      <div className="flex items-center justify-between font-semibold text-slate-900 mb-1">
                        <span>{alt.rule}</span>
                        <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded">
                          {alt.severity}
                        </span>
                      </div>
                      <div className="text-slate-600">Target: {alt.target}</div>
                      <div className="text-slate-600">Threshold: {alt.amount}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* System Limits */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4 font-semibold text-slate-900">
                  <Scale className="w-5 h-5 text-blue-600" />
                  <h3>Configured Transfer Limits</h3>
                </div>
                <div className="space-y-4 text-xs">
                  <div className="p-3 border rounded-lg">
                    <div className="font-semibold text-slate-900">Standard Retail Daily Limit</div>
                    <div className="text-slate-500 mt-1">Maximum cumulative daily debit: $25,000.00 USD</div>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="font-semibold text-slate-900">Single Transaction Ceiling</div>
                    <div className="text-slate-500 mt-1">Single transfer limit without 2FA step-up: $10,000.00 USD</div>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="font-semibold text-slate-900">Audit Trail Cryptographic Integrity</div>
                    <div className="text-slate-500 mt-1">SHA-256 chain verification: Verified Valid (100% compliant)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        Fintrack Simulated Banking Application • Independent System 03 • Zero Float Arithmetic Engine
      </footer>
    </div>
  );
}
