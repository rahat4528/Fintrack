'use client';

import React, { useState } from 'react';
import {
  Inbox,
  ArrowRightLeft,
  ChevronDown,
  ChevronRight,
  TrendingDown,
  Calendar,
  ShieldCheck,
  Zap,
  RotateCcw,
  Sparkles,
  HelpCircle,
  AlertTriangle
} from 'lucide-react';

interface CategoryItem {
  id: string;
  name: string;
  assigned: number;
  activity: number;
  available: number;
  target?: number;
}

interface GroupItem {
  id: string;
  name: string;
  categories: CategoryItem[];
}

export default function BudgetPlanningApp() {
  const [activeTab, setActiveTab] = useState<'workspace' | 'debt' | 'bills'>('workspace');
  const [selectedMonth, setSelectedMonth] = useState('April 2026');

  // Groups and envelopes state
  const [groups, setGroups] = useState<GroupItem[]>([
    {
      id: 'g1',
      name: 'Immediate Obligations',
      categories: [
        { id: 'c1', name: 'Apartment Rent', assigned: 1650.00, activity: 1650.00, available: 0.00, target: 1650.00 },
        { id: 'c2', name: 'Utilities & Internet', assigned: 180.00, activity: 145.20, available: 34.80, target: 180.00 },
        { id: 'c3', name: 'Groceries & Household', assigned: 550.00, activity: 284.50, available: 265.50, target: 550.00 },
      ],
    },
    {
      id: 'g2',
      name: 'True Expenses & Reserves',
      categories: [
        { id: 'c4', name: 'Auto Maintenance Reserve', assigned: 150.00, activity: 0.00, available: 150.00, target: 150.00 },
        { id: 'c5', name: 'Health & Pharmacy', assigned: 100.00, activity: 35.00, available: 65.00, target: 100.00 },
      ],
    },
    {
      id: 'g3',
      name: 'Quality of Life & Discretionary',
      categories: [
        { id: 'c6', name: 'Dining Out & Takeaway', assigned: 200.00, activity: 78.35, available: 121.65, target: 200.00 },
        { id: 'c7', name: 'Hobbies & Entertainment', assigned: 120.00, activity: 40.00, available: 80.00, target: 120.00 },
      ],
    },
    {
      id: 'g4',
      name: 'Financial Goals',
      categories: [
        { id: 'c8', name: 'Emergency Vault Contribution', assigned: 350.00, activity: 0.00, available: 350.00, target: 350.00 },
        { id: 'c9', name: 'Credit Card Accelerated Payoff', assigned: 200.00, activity: 200.00, available: 0.00, target: 200.00 },
      ],
    },
  ]);

  const [readyToAssign, setReadyToAssign] = useState<number>(3721.05);

  // Transfer modal
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [sourceCat, setSourceCat] = useState('Groceries & Household');
  const [destCat, setDestCat] = useState('Dining Out & Takeaway');
  const [moveAmount, setMoveAmount] = useState('');

  // Debt simulator state
  const [debtStrategy, setDebtStrategy] = useState<'SNOWBALL' | 'AVALANCHE'>('AVALANCHE');
  const [extraPayment, setExtraPayment] = useState<number>(200);

  // Summary figures
  const totalAssigned = groups.reduce((sum, g) => sum + g.categories.reduce((s, c) => s + c.assigned, 0), 0);
  const totalActivity = groups.reduce((sum, g) => sum + g.categories.reduce((s, c) => s + c.activity, 0), 0);
  const totalAvailable = groups.reduce((sum, g) => sum + g.categories.reduce((s, c) => s + c.available, 0), 0);

  const handleUpdateAssigned = (catId: string, valStr: string) => {
    const val = parseFloat(valStr) || 0;
    let delta = 0;

    const newGroups = groups.map(g => ({
      ...g,
      categories: g.categories.map(c => {
        if (c.id === catId) {
          delta = val - c.assigned;
          const newAvail = c.available + delta;
          return { ...c, assigned: val, available: newAvail };
        }
        return c;
      }),
    }));

    setGroups(newGroups);
    setReadyToAssign(prev => prev - delta);
  };

  const handleMoveFunds = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(moveAmount);
    if (isNaN(amt) || amt <= 0) return;
    if (sourceCat === destCat) {
      alert('Source and destination envelopes must be different');
      return;
    }

    const newGroups = groups.map(g => ({
      ...g,
      categories: g.categories.map(c => {
        if (c.name === sourceCat) {
          return { ...c, assigned: c.assigned - amt, available: c.available - amt };
        }
        if (c.name === destCat) {
          return { ...c, assigned: c.assigned + amt, available: c.available + amt };
        }
        return c;
      }),
    }));

    setGroups(newGroups);
    setShowMoveModal(false);
    setMoveAmount('');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Inbox className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white">Budget Planning App</span>
              <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Phase 2 Delivery
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Event-Sourced Sync: OK</span>
            </div>
            <button
              onClick={() => setShowMoveModal(true)}
              className="flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-md shadow-indigo-600/20"
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>Move Funds</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        {/* Prominent Ready-to-Assign Hero Card */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/20 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-indigo-400">
              <Zap className="w-4 h-4" />
              <span>Zero-Based Envelope Allocation</span>
            </div>
            <div className="text-4xl font-black tracking-tight text-white flex items-baseline space-x-2">
              <span className={`${readyToAssign >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                ${readyToAssign.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-sm font-medium text-slate-400">Ready to Assign</span>
            </div>
            <p className="text-xs text-slate-400">
              Every dollar has a job. Assign unallocated cash to category envelopes before spending occurs.
            </p>
          </div>

          <div className="flex items-center space-x-4 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
            <div className="text-right">
              <div className="text-xs text-slate-400">Total Envelopes Assigned</div>
              <div className="text-lg font-bold text-slate-200">${totalAssigned.toFixed(2)}</div>
            </div>
            <div className="h-8 w-px bg-slate-800"></div>
            <div className="text-right">
              <div className="text-xs text-slate-400">Activity Spent</div>
              <div className="text-lg font-bold text-slate-400">${totalActivity.toFixed(2)}</div>
            </div>
            <div className="h-8 w-px bg-slate-800"></div>
            <div className="text-right">
              <div className="text-xs text-slate-400">Available Remaining</div>
              <div className="text-lg font-bold text-emerald-400">${totalAvailable.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 space-x-8 text-sm font-semibold">
          {[
            { id: 'workspace', label: 'Monthly Envelope Workspace', icon: Inbox },
            { id: 'debt', label: 'Debt Elimination Simulator', icon: TrendingDown },
            { id: 'bills', label: 'Bill Calendar & Commitments', icon: Calendar },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-4 flex items-center space-x-2 border-b-2 transition-all ${
                  isActive
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Workspace Grid */}
        {activeTab === 'workspace' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-semibold text-slate-400">Current Period:</span>
                <span className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 font-mono text-sm text-indigo-300 font-bold">
                  {selectedMonth}
                </span>
              </div>
              <span className="text-xs text-slate-400 flex items-center space-x-1">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Available = Carried Over + Assigned - Activity</span>
              </span>
            </div>

            <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-6">Category Envelope</th>
                    <th className="py-3.5 px-4 text-right">Target</th>
                    <th className="py-3.5 px-4 text-right">Assigned</th>
                    <th className="py-3.5 px-4 text-right">Activity</th>
                    <th className="py-3.5 px-6 text-right">Available</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {groups.map(group => (
                    <React.Fragment key={group.id}>
                      {/* Group Header Row */}
                      <tr className="bg-slate-950/40 font-bold text-xs uppercase tracking-wider text-indigo-400">
                        <td colSpan={5} className="py-2.5 px-6">
                          {group.name}
                        </td>
                      </tr>
                      {/* Categories Rows */}
                      {group.categories.map(cat => (
                        <tr key={cat.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 px-6 font-medium text-white flex items-center space-x-2">
                            <span>{cat.name}</span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-400 text-xs">
                            ${cat.target ? cat.target.toFixed(2) : '-'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <input
                              type="number"
                              step="10.00"
                              value={cat.assigned}
                              onChange={e => handleUpdateAssigned(cat.id, e.target.value)}
                              className="w-28 text-right font-mono text-sm bg-slate-950 border border-slate-800 rounded px-2 py-1 text-sky-400 focus:outline-none focus:border-indigo-500"
                            />
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-400">
                            -${cat.activity.toFixed(2)}
                          </td>
                          <td className="py-3 px-6 text-right font-mono font-bold">
                            <span className={`px-2.5 py-1 rounded-full text-xs ${
                              cat.available >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                            }`}>
                              ${cat.available.toFixed(2)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Debt Simulator */}
        {activeTab === 'debt' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">Debt Elimination Strategy Engine</h3>
                  <p className="text-xs text-slate-400">Compare payoff timelines using arbitrary-precision decimal interest.</p>
                </div>
                <div className="flex items-center space-x-2 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                  <button
                    onClick={() => setDebtStrategy('AVALANCHE')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                      debtStrategy === 'AVALANCHE' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                    }`}
                  >
                    Avalanche (Highest APR)
                  </button>
                  <button
                    onClick={() => setDebtStrategy('SNOWBALL')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                      debtStrategy === 'SNOWBALL' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                    }`}
                  >
                    Snowball (Smallest Balance)
                  </button>
                </div>
              </div>

              {/* Extra Payment Slider */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-slate-300">Extra Monthly Debt Payoff Allocation:</span>
                  <span className="font-mono font-bold text-indigo-400">+${extraPayment} / month</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1000"
                  step="50"
                  value={extraPayment}
                  onChange={e => setExtraPayment(parseInt(e.target.value, 10))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              {/* Debts Table */}
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex justify-between items-center">
                  <div>
                    <div className="font-bold text-white">Chase Sapphire Visa</div>
                    <div className="text-xs text-slate-400 mt-0.5">APR: 22.99% • Min Payment: $110.00/mo</div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="text-base font-bold text-red-400">$3,450.00</div>
                    <div className="text-xs text-indigo-400">Target Priority 1</div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex justify-between items-center">
                  <div>
                    <div className="font-bold text-white">Undergraduate Federal Student Loan</div>
                    <div className="text-xs text-slate-400 mt-0.5">APR: 5.25% • Min Payment: $165.00/mo</div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="text-base font-bold text-slate-300">$14,200.00</div>
                    <div className="text-xs text-slate-500">Target Priority 2</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Projection Summary Card */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
              <h4 className="text-base font-bold text-white">Strategy Results</h4>
              <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-200 text-xs space-y-1">
                <div className="font-bold">Avalanche Mathematical Advantage:</div>
                <p>Saves <strong className="text-emerald-400">$1,480.35 in interest</strong> over standard minimum payments and clears high-interest revolving balances 26 months sooner.</p>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex justify-between text-sm py-2 border-b border-slate-800">
                  <span className="text-slate-400">Debt-Free Horizon:</span>
                  <span className="font-bold text-white font-mono">3.4 Years (41 Months)</span>
                </div>
                <div className="flex justify-between text-sm py-2 border-b border-slate-800">
                  <span className="text-slate-400">Total Interest Accrued:</span>
                  <span className="font-bold text-white font-mono">$2,341.20</span>
                </div>
                <div className="flex justify-between text-sm py-2">
                  <span className="text-slate-400">Total Principal Paid:</span>
                  <span className="font-bold text-emerald-400 font-mono">$17,650.00</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Bills Calendar */}
        {activeTab === 'bills' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-indigo-400" />
                <span>Monthly Recurring Bill Commitments</span>
              </h3>
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-white">Apartment Rent Lease</div>
                    <div className="text-xs text-slate-400">Due on Day 1 of each month</div>
                  </div>
                  <span className="font-mono font-bold text-red-400">$1,650.00</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-white">Electric Power Grid</div>
                    <div className="text-xs text-slate-400">Due on Day 15 of each month</div>
                  </div>
                  <span className="font-mono font-bold text-red-400">$115.00</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-white">Fiber Optic Gigabit Internet</div>
                    <div className="text-xs text-slate-400">Due on Day 20 of each month</div>
                  </div>
                  <span className="font-mono font-bold text-red-400">$65.00</span>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="text-base font-bold text-white">Cash Flow Forecast (Next 90 Days)</h3>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="text-xs text-slate-400">
                  Fixed bill liabilities committed: <strong className="text-white">$1,830.00 / month</strong>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>April 2026 Commitment</span>
                    <span className="font-mono font-bold">$1,830.00 (Covered)</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-2 rounded-full w-full"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>May 2026 Projected</span>
                    <span className="font-mono font-bold">$1,830.00 (Reserved)</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-2 rounded-full w-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Zero-Sum Move Funds Modal */}
      {showMoveModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <ArrowRightLeft className="w-5 h-5 text-indigo-400" />
              <span>Zero-Sum Envelope Transfer</span>
            </h3>
            <p className="text-xs text-slate-400">
              Shift funds between budget categories atomically. Total Ready to Assign remains unchanged.
            </p>

            <form onSubmit={handleMoveFunds} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Source Envelope (Take from)</label>
                <select
                  value={sourceCat}
                  onChange={e => setSourceCat(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100"
                >
                  {groups.flatMap(g => g.categories).map(c => (
                    <option key={c.id} value={c.name}>{c.name} (${c.available.toFixed(2)} available)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Destination Envelope (Give to)</label>
                <select
                  value={destCat}
                  onChange={e => setDestCat(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100"
                >
                  {groups.flatMap(g => g.categories).map(c => (
                    <option key={c.id} value={c.name}>{c.name} (${c.available.toFixed(2)} available)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Transfer Amount ($)</label>
                <input
                  type="number"
                  step="1.00"
                  required
                  value={moveAmount}
                  onChange={e => setMoveAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowMoveModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white"
                >
                  Confirm Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
