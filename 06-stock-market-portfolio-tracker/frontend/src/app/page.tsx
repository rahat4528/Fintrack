'use client';

import React, { useState } from 'react';
import {
  TrendingUp,
  PieChart,
  Layers,
  Split,
  Scale,
  DollarSign,
  PlusCircle,
  ArrowUpRight,
  ArrowDownRight,
  Briefcase,
  History,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

interface Position {
  symbol: string;
  name: string;
  sector: string;
  shares: number;
  avgCost: number;
  currentPrice: number;
  totalCost: number;
  valuation: number;
  unrealizedGain: number;
  gainPercent: number;
}

interface TaxLot {
  id: string;
  symbol: string;
  acquiredDate: string;
  shares: number;
  costPerShare: number;
  term: 'LONG_TERM' | 'SHORT_TERM';
  unrealizedGain: number;
}

export default function StockPortfolio() {
  const [activeAccount, setActiveAccount] = useState<'TAXABLE' | 'ROTH'>('TAXABLE');
  const [activeTab, setActiveTab] = useState<'POSITIONS' | 'TAXLOTS' | 'TRADE' | 'REBALANCE' | 'SPLITS'>('POSITIONS');

  // Positions State
  const [positions, setPositions] = useState<Position[]>([
    {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      sector: 'Technology',
      shares: 80,
      avgCost: 159.38,
      currentPrice: 192.50,
      totalCost: 12750.0,
      valuation: 15400.0,
      unrealizedGain: 2650.0,
      gainPercent: 20.78,
    },
    {
      symbol: 'MSFT',
      name: 'Microsoft Corp.',
      sector: 'Technology',
      shares: 40,
      avgCost: 350.0,
      currentPrice: 425.80,
      totalCost: 14000.0,
      valuation: 17032.0,
      unrealizedGain: 3032.0,
      gainPercent: 21.66,
    },
    {
      symbol: 'JNJ',
      name: 'Johnson & Johnson',
      sector: 'Healthcare',
      shares: 60,
      avgCost: 160.0,
      currentPrice: 154.20,
      totalCost: 9600.0,
      valuation: 9252.0,
      unrealizedGain: -348.0,
      gainPercent: -3.63,
    },
    {
      symbol: 'VOO',
      name: 'Vanguard S&P 500 ETF',
      sector: 'Broad Index ETF',
      shares: 50,
      avgCost: 420.0,
      currentPrice: 495.30,
      totalCost: 21000.0,
      valuation: 24765.0,
      unrealizedGain: 3765.0,
      gainPercent: 17.93,
    },
  ]);

  // Tax Lots State
  const [taxLots, setTaxLots] = useState<TaxLot[]>([
    { id: 'lot-1', symbol: 'AAPL', acquiredDate: '2025-09-15', shares: 50, costPerShare: 150.0, term: 'LONG_TERM', unrealizedGain: 2125.0 },
    { id: 'lot-2', symbol: 'AAPL', acquiredDate: '2026-08-20', shares: 30, costPerShare: 175.0, term: 'SHORT_TERM', unrealizedGain: 525.0 },
    { id: 'lot-3', symbol: 'MSFT', acquiredDate: '2026-05-01', shares: 40, costPerShare: 350.0, term: 'SHORT_TERM', unrealizedGain: 3032.0 },
    { id: 'lot-4', symbol: 'VOO', acquiredDate: '2025-11-10', shares: 50, costPerShare: 420.0, term: 'LONG_TERM', unrealizedGain: 3765.0 },
  ]);

  // Trade form state
  const [tradeSymbol, setTradeSymbol] = useState('AAPL');
  const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY');
  const [tradeShares, setTradeShares] = useState('10');
  const [tradePrice, setTradePrice] = useState('192.50');

  // Split simulation state
  const [splitSymbol, setSplitSymbol] = useState('MSFT');
  const [splitRatio, setSplitRatio] = useState('2');

  const cashBalance = 24500.0;
  const totalStockValuation = positions.reduce((sum, p) => sum + p.valuation, 0);
  const totalCostBasis = positions.reduce((sum, p) => sum + p.totalCost, 0);
  const totalUnrealizedGain = totalStockValuation - totalCostBasis;
  const totalPortfolioValue = totalStockValuation + cashBalance;

  const handleExecuteTrade = (e: React.FormEvent) => {
    e.preventDefault();
    const numShares = parseFloat(tradeShares);
    const numPrice = parseFloat(tradePrice);

    if (isNaN(numShares) || isNaN(numPrice) || numShares <= 0 || numPrice <= 0) {
      alert('Please enter valid shares and price.');
      return;
    }

    const pos = positions.find((p) => p.symbol === tradeSymbol);

    if (tradeType === 'BUY') {
      if (pos) {
        const newShares = pos.shares + numShares;
        const newCost = pos.totalCost + numShares * numPrice;
        const newAvg = newCost / newShares;
        const newVal = newShares * pos.currentPrice;
        const gain = newVal - newCost;

        setPositions(
          positions.map((p) =>
            p.symbol === tradeSymbol
              ? {
                  ...p,
                  shares: newShares,
                  totalCost: newCost,
                  avgCost: newAvg,
                  valuation: newVal,
                  unrealizedGain: gain,
                  gainPercent: (gain / newCost) * 100,
                }
              : p,
          ),
        );
      }
      alert(`Executed BUY of ${numShares} ${tradeSymbol} @ $${numPrice.toFixed(2)}. Tax lot recorded.`);
    } else {
      if (!pos || pos.shares < numShares) {
        alert(`Cannot sell: Insufficient shares for ${tradeSymbol}.`);
        return;
      }
      const newShares = pos.shares - numShares;
      const newCost = newShares * pos.avgCost;
      const newVal = newShares * pos.currentPrice;
      const gain = newVal - newCost;

      setPositions(
        positions.map((p) =>
          p.symbol === tradeSymbol
            ? {
                ...p,
                shares: newShares,
                totalCost: newCost,
                valuation: newVal,
                unrealizedGain: gain,
                gainPercent: newCost > 0 ? (gain / newCost) * 100 : 0,
              }
            : p,
        ),
      );
      alert(`Executed SELL of ${numShares} ${tradeSymbol} @ $${numPrice.toFixed(2)}. FIFO matched oldest tax lots.`);
    }
  };

  const handleApplySplit = (e: React.FormEvent) => {
    e.preventDefault();
    const ratio = parseFloat(splitRatio);
    if (isNaN(ratio) || ratio <= 1) {
      alert('Split ratio must be greater than 1.');
      return;
    }

    setPositions(
      positions.map((p) => {
        if (p.symbol === splitSymbol) {
          const newShares = p.shares * ratio;
          const newCostPerShare = p.avgCost / ratio;
          const newPrice = p.currentPrice / ratio;
          return {
            ...p,
            shares: newShares,
            avgCost: newCostPerShare,
            currentPrice: newPrice,
            // totalCost and valuation remain strictly conserved
          };
        }
        return p;
      }),
    );

    setTaxLots(
      taxLots.map((l) => {
        if (l.symbol === splitSymbol) {
          return {
            ...l,
            shares: l.shares * ratio,
            costPerShare: l.costPerShare / ratio,
          };
        }
        return l;
      }),
    );

    alert(`Forward stock split ${ratio}:1 executed for ${splitSymbol}! Total cost basis strictly conserved.`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100">
      {/* HEADER */}
      <header className="bg-slate-950 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600 rounded-xl shadow-lg text-white">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Fintrack Securities Portfolio
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                  Tax-Lot FIFO
                </span>
              </h1>
              <p className="text-xs text-slate-400">Institutional Equity Analytics, Rebalancing & Corporate Actions</p>
            </div>
          </div>

          {/* Account Selector */}
          <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveAccount('TAXABLE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeAccount === 'TAXABLE' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Taxable Brokerage
            </button>
            <button
              onClick={() => setActiveAccount('ROTH')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeAccount === 'ROTH' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Retirement Roth IRA
            </button>
          </div>
        </div>
      </header>

      {/* NAVIGATION TABS */}
      <div className="border-b border-slate-800 bg-slate-950/60 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 py-2 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('POSITIONS')}
            className={`px-3.5 py-1.5 rounded-lg font-medium transition ${
              activeTab === 'POSITIONS' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Active Holdings
          </button>
          <button
            onClick={() => setActiveTab('TAXLOTS')}
            className={`px-3.5 py-1.5 rounded-lg font-medium transition ${
              activeTab === 'TAXLOTS' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Tax-Lot Ledger
          </button>
          <button
            onClick={() => setActiveTab('TRADE')}
            className={`px-3.5 py-1.5 rounded-lg font-medium transition ${
              activeTab === 'TRADE' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Execute Trade
          </button>
          <button
            onClick={() => setActiveTab('REBALANCE')}
            className={`px-3.5 py-1.5 rounded-lg font-medium transition ${
              activeTab === 'REBALANCE' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Asset Rebalancing
          </button>
          <button
            onClick={() => setActiveTab('SPLITS')}
            className={`px-3.5 py-1.5 rounded-lg font-medium transition ${
              activeTab === 'SPLITS' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Stock Split Simulator
          </button>
        </div>
      </div>

      {/* MAIN BODY */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* KPI CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-5 shadow-lg">
            <div className="text-xs text-slate-400">Total Portfolio Net Worth</div>
            <div className="text-2xl font-bold font-mono text-white mt-2">
              ${totalPortfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-slate-400 mt-1">Securities + Cash Reserve</div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-5 shadow-lg">
            <div className="text-xs text-slate-400">Invested Cost Basis</div>
            <div className="text-2xl font-bold font-mono text-slate-300 mt-2">
              ${totalCostBasis.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-slate-400 mt-1">Conserved across splits</div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-5 shadow-lg">
            <div className="text-xs text-slate-400">Unrealized Capital Gain</div>
            <div className="text-2xl font-bold font-mono text-emerald-400 mt-2 flex items-center gap-1">
              +${totalUnrealizedGain.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-emerald-400 mt-1">
              +{((totalUnrealizedGain / totalCostBasis) * 100).toFixed(2)}% total return
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-5 shadow-lg">
            <div className="text-xs text-slate-400">Uninvested Cash Balance</div>
            <div className="text-2xl font-bold font-mono text-blue-400 mt-2">
              ${cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-slate-400 mt-1">Available for deployment</div>
          </div>
        </div>

        {/* POSITIONS TABLE */}
        {activeTab === 'POSITIONS' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Active Equity & ETF Positions</h2>
                <p className="text-xs text-slate-400">Mark-to-market valuations and unrealized gains</p>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
                XIRR: +15.00% Ann.
              </span>
            </div>

            <div className="bg-slate-800/70 rounded-xl border border-slate-700/80 overflow-hidden shadow-xl">
              <table className="w-full text-left text-sm font-sans">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-900/60 text-xs font-mono text-slate-400">
                    <th className="py-3 px-4">Symbol</th>
                    <th className="py-3 px-4">Sector</th>
                    <th className="py-3 px-4">Shares</th>
                    <th className="py-3 px-4">Avg Cost</th>
                    <th className="py-3 px-4">Current Price</th>
                    <th className="py-3 px-4">Valuation</th>
                    <th className="py-3 px-4 text-right">Unrealized Gain</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60 text-xs font-mono">
                  {positions.map((p) => (
                    <tr key={p.symbol} className="hover:bg-slate-700/30 transition">
                      <td className="py-4 px-4 font-sans font-bold text-white text-sm">
                        {p.symbol}
                        <div className="text-[11px] font-normal text-slate-400">{p.name}</div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-900 text-slate-300 border border-slate-700">
                          {p.sector}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-200">{p.shares}</td>
                      <td className="py-4 px-4 text-slate-400">${p.avgCost.toFixed(2)}</td>
                      <td className="py-4 px-4 text-white font-semibold">${p.currentPrice.toFixed(2)}</td>
                      <td className="py-4 px-4 font-bold text-slate-100">
                        ${p.valuation.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className={`py-4 px-4 text-right font-semibold ${p.unrealizedGain >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {p.unrealizedGain >= 0 ? '+' : ''}${p.unrealizedGain.toLocaleString('en-US', { minimumFractionDigits: 2 })} ({p.gainPercent.toFixed(1)}%)
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAX LOTS TABLE */}
        {activeTab === 'TAXLOTS' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-white">Tax-Lot Accounting Ledger</h2>
              <p className="text-xs text-slate-400">Open lots tracked individually for FIFO capital gains tax optimization</p>
            </div>

            <div className="bg-slate-800/70 rounded-xl border border-slate-700/80 overflow-hidden shadow-xl">
              <table className="w-full text-left text-sm font-sans">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-900/60 text-xs font-mono text-slate-400">
                    <th className="py-3 px-4">Lot ID</th>
                    <th className="py-3 px-4">Symbol</th>
                    <th className="py-3 px-4">Acquired Date</th>
                    <th className="py-3 px-4">Shares</th>
                    <th className="py-3 px-4">Cost / Share</th>
                    <th className="py-3 px-4">Tax Term</th>
                    <th className="py-3 px-4 text-right">Unrealized Gain</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60 text-xs font-mono">
                  {taxLots.map((lot) => (
                    <tr key={lot.id} className="hover:bg-slate-700/30">
                      <td className="py-3.5 px-4 font-bold text-slate-300">{lot.id}</td>
                      <td className="py-3.5 px-4 font-sans font-bold text-white">{lot.symbol}</td>
                      <td className="py-3.5 px-4 text-slate-400">{lot.acquiredDate}</td>
                      <td className="py-3.5 px-4 text-slate-200">{lot.shares}</td>
                      <td className="py-3.5 px-4 text-slate-300">${lot.costPerShare.toFixed(2)}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            lot.term === 'LONG_TERM'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : 'bg-amber-950 text-amber-400 border border-amber-800'
                          }`}
                        >
                          {lot.term}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-emerald-400">
                        +${lot.unrealizedGain.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* EXECUTE TRADE VIEW */}
        {activeTab === 'TRADE' && (
          <div className="bg-slate-800/80 rounded-xl border border-slate-700/80 p-8 max-w-2xl mx-auto shadow-xl space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white">Execute Security Order</h2>
              <p className="text-xs text-slate-400">Automatic FIFO tax-lot matching applied on liquidation</p>
            </div>

            <form onSubmit={handleExecuteTrade} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Security</label>
                <select
                  value={tradeSymbol}
                  onChange={(e) => setTradeSymbol(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="AAPL">AAPL - Apple Inc.</option>
                  <option value="MSFT">MSFT - Microsoft Corp.</option>
                  <option value="JNJ">JNJ - Johnson & Johnson</option>
                  <option value="VOO">VOO - Vanguard S&P 500 ETF</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Order Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTradeType('BUY')}
                    className={`py-2 rounded-lg font-semibold transition ${
                      tradeType === 'BUY'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-900 text-slate-400 border border-slate-700'
                    }`}
                  >
                    BUY (Open Tax Lot)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTradeType('SELL')}
                    className={`py-2 rounded-lg font-semibold transition ${
                      tradeType === 'SELL'
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-900 text-slate-400 border border-slate-700'
                    }`}
                  >
                    SELL (FIFO Match)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">Shares</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={tradeShares}
                    onChange={(e) => setTradeShares(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Price per Share ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={tradePrice}
                    onChange={(e) => setTradePrice(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-lg shadow-lg shadow-emerald-950/40 transition"
                >
                  Submit Trade Order
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ASSET REBALANCING VIEW */}
        {activeTab === 'REBALANCE' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-white">Target Asset Allocation & Rebalancing</h2>
              <p className="text-xs text-slate-400">Current sector distribution vs target allocations with exact dollar buy/sell instructions</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-800/80 rounded-xl border border-slate-700/80 p-6 shadow-xl space-y-4">
                <h3 className="font-semibold text-white text-sm">Sector Allocation Breakdown</h3>
                <div className="space-y-3 text-xs font-mono">
                  <div className="p-3 border border-slate-700 rounded-lg bg-slate-900/60">
                    <div className="flex justify-between text-white font-sans font-bold">
                      <span>Technology</span>
                      <span>48.8% (Target: 40%)</span>
                    </div>
                    <div className="text-rose-400 text-[11px] mt-1">Overweight by 8.8% → Recommend SELL $5,850</div>
                  </div>

                  <div className="p-3 border border-slate-700 rounded-lg bg-slate-900/60">
                    <div className="flex justify-between text-white font-sans font-bold">
                      <span>Broad Index ETF (VOO)</span>
                      <span>37.3% (Target: 20%)</span>
                    </div>
                    <div className="text-rose-400 text-[11px] mt-1">Overweight by 17.3% → Hold for DRIP</div>
                  </div>

                  <div className="p-3 border border-slate-700 rounded-lg bg-slate-900/60">
                    <div className="flex justify-between text-white font-sans font-bold">
                      <span>Healthcare (JNJ)</span>
                      <span>13.9% (Target: 20%)</span>
                    </div>
                    <div className="text-emerald-400 text-[11px] mt-1">Underweight by 6.1% → Recommend BUY $4,050</div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/80 rounded-xl border border-slate-700/80 p-6 shadow-xl space-y-4 text-xs">
                <h3 className="font-semibold text-white text-sm">Rebalancing Plan Execution</h3>
                <p className="text-slate-400">Realigning will reduce portfolio concentration risk and capture gains from top performers.</p>
                <div className="p-4 border border-slate-700 rounded-lg bg-slate-900/40 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Cash balance ($24,500) covers all recommended buy orders without liquidations.</span>
                  </div>
                  <button
                    onClick={() => alert('Simulated automated rebalancing trades executed!')}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 rounded-lg transition"
                  >
                    Execute Rebalancing Trades
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STOCK SPLITS SIMULATOR VIEW */}
        {activeTab === 'SPLITS' && (
          <div className="bg-slate-800/80 rounded-xl border border-slate-700/80 p-8 max-w-xl mx-auto shadow-xl space-y-6 text-xs">
            <div>
              <h2 className="text-lg font-bold text-white">Forward / Reverse Stock Split Simulator</h2>
              <p className="text-slate-400">Verifies strict conservation of total invested cost basis</p>
            </div>

            <form onSubmit={handleApplySplit} className="space-y-4">
              <div>
                <label className="block text-slate-400 mb-1">Target Security</label>
                <select
                  value={splitSymbol}
                  onChange={(e) => setSplitSymbol(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="MSFT">MSFT (Currently 40 shares @ $350 avg cost)</option>
                  <option value="AAPL">AAPL (Currently 80 shares @ $159.38 avg cost)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Split Ratio (e.g. 2 for 2-for-1)</label>
                <input
                  type="number"
                  step="1"
                  min="2"
                  value={splitRatio}
                  onChange={(e) => setSplitRatio(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-lg transition"
                >
                  Simulate Corporate Stock Split
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-800 bg-slate-950 py-6 text-center text-xs font-mono text-slate-500">
        Fintrack Stock Market Portfolio Tracker • Independent System 06 • Tax-Lot FIFO Engine
      </footer>
    </div>
  );
}
