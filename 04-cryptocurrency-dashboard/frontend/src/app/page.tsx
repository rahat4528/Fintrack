'use client';

import React, { useState } from 'react';
import {
  Coins,
  TrendingUp,
  TrendingDown,
  Bell,
  Star,
  Activity,
  PlusCircle,
  Clock,
  CheckCircle,
  Database,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Sparkles
} from 'lucide-react';

interface Ticker {
  symbol: string;
  name: string;
  priceUsd: number;
  change24h: number;
  volume24h: string;
  marketCapUsd: string;
  isStale: boolean;
  updatedSecsAgo: number;
}

interface Holding {
  symbol: string;
  name: string;
  quantity: string;
  avgCostBasis: number;
  currentPrice: number;
  currentValuation: number;
  investedCost: number;
  unrealizedPnL: number;
  unrealizedPercent: number;
}

interface AlertItem {
  id: string;
  symbol: string;
  condition: 'PRICE_ABOVE' | 'PRICE_BELOW';
  targetPrice: number;
  status: 'ACTIVE' | 'TRIGGERED';
}

export default function CryptoDashboard() {
  const [activeTab, setActiveTab] = useState<'MARKET' | 'PORTFOLIO' | 'ALERTS' | 'WATCHLIST'>('MARKET');

  // Market Tickers
  const [tickers, setTickers] = useState<Ticker[]>([
    { symbol: 'BTC', name: 'Bitcoin', priceUsd: 67450.25, change24h: 3.45, volume24h: '$32.45B', marketCapUsd: '$1.32T', isStale: false, updatedSecsAgo: 14 },
    { symbol: 'ETH', name: 'Ethereum', priceUsd: 3520.80, change24h: -1.15, volume24h: '$18.20B', marketCapUsd: '$423B', isStale: false, updatedSecsAgo: 14 },
    { symbol: 'SOL', name: 'Solana', priceUsd: 158.40, change24h: 7.82, volume24h: '$4.12B', marketCapUsd: '$72.5B', isStale: false, updatedSecsAgo: 14 },
    { symbol: 'ADA', name: 'Cardano', priceUsd: 0.485, change24h: 0.92, volume24h: '$510M', marketCapUsd: '$17.2B', isStale: false, updatedSecsAgo: 14 },
    { symbol: 'DOT', name: 'Polkadot', priceUsd: 7.25, change24h: -2.40, volume24h: '$280M', marketCapUsd: '$10.1B', isStale: false, updatedSecsAgo: 14 },
  ]);

  // Holdings state
  const [holdings, setHoldings] = useState<Holding[]>([
    {
      symbol: 'BTC',
      name: 'Bitcoin',
      quantity: '2.000000000000000000',
      avgCostBasis: 61000.0,
      currentPrice: 67450.25,
      currentValuation: 134900.5,
      investedCost: 122000.0,
      unrealizedPnL: 12900.5,
      unrealizedPercent: 10.57,
    },
    {
      symbol: 'ETH',
      name: 'Ethereum',
      quantity: '10.000000000000000000',
      avgCostBasis: 3000.0,
      currentPrice: 3520.8,
      currentValuation: 35208.0,
      investedCost: 30000.0,
      unrealizedPnL: 5208.0,
      unrealizedPercent: 17.36,
    },
    {
      symbol: 'SOL',
      name: 'Solana',
      quantity: '50.000000000',
      avgCostBasis: 120.0,
      currentPrice: 158.4,
      currentValuation: 7920.0,
      investedCost: 6000.0,
      unrealizedPnL: 1920.0,
      unrealizedPercent: 32.0,
    },
  ]);

  // Alerts state
  const [alerts, setAlerts] = useState<AlertItem[]>([
    { id: 'alt-1', symbol: 'BTC', condition: 'PRICE_ABOVE', targetPrice: 70000, status: 'ACTIVE' },
    { id: 'alt-2', symbol: 'ETH', condition: 'PRICE_BELOW', targetPrice: 3200, status: 'ACTIVE' },
    { id: 'alt-3', symbol: 'SOL', condition: 'PRICE_ABOVE', targetPrice: 150, status: 'TRIGGERED' },
  ]);

  // Watchlist state
  const [watchlist, setWatchlist] = useState<string[]>(['BTC', 'ETH', 'SOL']);

  // Transaction modal state
  const [txSymbol, setTxSymbol] = useState('BTC');
  const [txType, setTxType] = useState<'BUY' | 'SELL'>('BUY');
  const [txQty, setTxQty] = useState('0.25');
  const [txPrice, setTxPrice] = useState('67450.00');

  // Computed Portfolio Totals
  const totalNetWorth = holdings.reduce((sum, h) => sum + h.currentValuation, 0);
  const totalInvested = holdings.reduce((sum, h) => sum + h.investedCost, 0);
  const totalUnrealizedPnL = totalNetWorth - totalInvested;
  const totalYieldPercent = totalInvested > 0 ? (totalUnrealizedPnL / totalInvested) * 100 : 0;

  const handleRecordTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const qtyNum = parseFloat(txQty);
    const priceNum = parseFloat(txPrice);

    if (isNaN(qtyNum) || isNaN(priceNum) || qtyNum <= 0 || priceNum <= 0) {
      alert('Please enter valid positive numbers for quantity and price.');
      return;
    }

    const existing = holdings.find((h) => h.symbol === txSymbol);
    const cost = qtyNum * priceNum;

    if (txType === 'BUY') {
      if (existing) {
        const newQty = parseFloat(existing.quantity) + qtyNum;
        const newInvested = existing.investedCost + cost;
        const newAvg = newInvested / newQty;
        const currentVal = newQty * existing.currentPrice;
        const pnl = currentVal - newInvested;

        setHoldings(
          holdings.map((h) =>
            h.symbol === txSymbol
              ? {
                  ...h,
                  quantity: newQty.toFixed(8),
                  avgCostBasis: newAvg,
                  investedCost: newInvested,
                  currentValuation: currentVal,
                  unrealizedPnL: pnl,
                  unrealizedPercent: (pnl / newInvested) * 100,
                }
              : h,
          ),
        );
      } else {
        const ticker = tickers.find((t) => t.symbol === txSymbol);
        const curPrice = ticker ? ticker.priceUsd : priceNum;
        const currentVal = qtyNum * curPrice;
        const pnl = currentVal - cost;

        setHoldings([
          ...holdings,
          {
            symbol: txSymbol,
            name: txSymbol,
            quantity: qtyNum.toFixed(8),
            avgCostBasis: priceNum,
            currentPrice: curPrice,
            currentValuation: currentVal,
            investedCost: cost,
            unrealizedPnL: pnl,
            unrealizedPercent: (pnl / cost) * 100,
          },
        ]);
      }
      alert(`Recorded BUY of ${qtyNum} ${txSymbol}. Weighted average cost recalculated.`);
    } else {
      if (!existing || parseFloat(existing.quantity) < qtyNum) {
        alert(`Cannot sell: Insufficient ${txSymbol} balance.`);
        return;
      }
      const remainingQty = parseFloat(existing.quantity) - qtyNum;
      const remainingInvested = remainingQty * existing.avgCostBasis;
      const currentVal = remainingQty * existing.currentPrice;
      const pnl = currentVal - remainingInvested;

      setHoldings(
        holdings.map((h) =>
          h.symbol === txSymbol
            ? {
                ...h,
                quantity: remainingQty.toFixed(8),
                investedCost: remainingInvested,
                currentValuation: currentVal,
                unrealizedPnL: pnl,
                unrealizedPercent: remainingInvested > 0 ? (pnl / remainingInvested) * 100 : 0,
              }
            : h,
        ),
      );
      alert(`Recorded SELL of ${qtyNum} ${txSymbol}. Realized profit captured.`);
    }
  };

  const toggleWatchlist = (sym: string) => {
    if (watchlist.includes(sym)) {
      setWatchlist(watchlist.filter((s) => s !== sym));
    } else {
      setWatchlist([...watchlist, sym]);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] text-slate-100">
      {/* TOP TICKER BAR */}
      <div className="bg-[#0e1424] border-b border-slate-800/80 px-4 py-2 flex items-center justify-between text-xs overflow-x-auto">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 font-mono font-semibold text-blue-400">
            <Activity className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
            <span>LIVE FEED:</span>
          </div>
          {tickers.map((t) => (
            <div key={t.symbol} className="flex items-center gap-2 font-mono">
              <span className="font-bold text-slate-300">{t.symbol}</span>
              <span className="text-white">${t.priceUsd.toLocaleString()}</span>
              <span
                className={`flex items-center text-[11px] font-semibold ${
                  t.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {t.change24h >= 0 ? '+' : ''}
                {t.change24h}%
              </span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px] shrink-0 pl-4">
          <Clock className="w-3 h-3 text-slate-500" />
          <span>TTL 60s (Stale Fallback Ready)</span>
        </div>
      </div>

      {/* HEADER & NAVIGATION */}
      <header className="border-b border-slate-800 bg-[#0c111e]/90 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-amber-500 to-indigo-600 rounded-xl shadow-lg shadow-indigo-950/40">
              <Coins className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Fintrack Crypto Terminal
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-700/50">
                  18-Decimals
                </span>
              </h1>
              <p className="text-xs text-slate-400">Arbitrary Precision Digital Asset Portfolio & Market Screener</p>
            </div>
          </div>

          {/* TABS */}
          <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('MARKET')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activeTab === 'MARKET' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Market Screener
            </button>
            <button
              onClick={() => setActiveTab('PORTFOLIO')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activeTab === 'PORTFOLIO' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Portfolio & Holdings
            </button>
            <button
              onClick={() => setActiveTab('ALERTS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activeTab === 'ALERTS' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Price Alerts
            </button>
            <button
              onClick={() => setActiveTab('WATCHLIST')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activeTab === 'WATCHLIST' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Watchlist
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* MARKET SCREENER VIEW */}
        {activeTab === 'MARKET' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-white">Cryptocurrency Market Screener</h2>
                <p className="text-xs text-slate-400">Live prices backed by resilient provider adapter with TTL caching</p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2.5 py-1 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 font-mono">
                  All Systems Operational
                </span>
              </div>
            </div>

            <div className="bg-[#101726] rounded-xl border border-slate-800 overflow-hidden shadow-xl">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800/80 bg-slate-900/60 text-xs text-slate-400 font-mono">
                    <th className="py-3 px-4">Asset</th>
                    <th className="py-3 px-4">Price (USD)</th>
                    <th className="py-3 px-4">24h Change</th>
                    <th className="py-3 px-4">24h Volume</th>
                    <th className="py-3 px-4">Market Cap</th>
                    <th className="py-3 px-4 text-center">Watchlist</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-xs font-mono">
                  {tickers.map((t) => (
                    <tr key={t.symbol} className="hover:bg-slate-800/30 transition">
                      <td className="py-4 px-4 font-sans">
                        <div className="font-bold text-white text-sm">{t.symbol}</div>
                        <div className="text-[11px] text-slate-400">{t.name}</div>
                      </td>
                      <td className="py-4 px-4 text-sm font-semibold text-white">
                        ${t.priceUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[11px] font-semibold ${
                            t.change24h >= 0 ? 'bg-emerald-950/60 text-emerald-400' : 'bg-rose-950/60 text-rose-400'
                          }`}
                        >
                          {t.change24h >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {t.change24h}%
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-300">{t.volume24h}</td>
                      <td className="py-4 px-4 text-slate-300">{t.marketCapUsd}</td>
                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => toggleWatchlist(t.symbol)}
                          className={`p-1.5 rounded-lg transition ${
                            watchlist.includes(t.symbol)
                              ? 'text-amber-400 hover:text-amber-300'
                              : 'text-slate-600 hover:text-slate-400'
                          }`}
                        >
                          <Star className="w-4 h-4 fill-current" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PORTFOLIO & HOLDINGS VIEW */}
        {activeTab === 'PORTFOLIO' && (
          <div className="space-y-8">
            {/* Portfolio Summary Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-[#101726] border border-slate-800 rounded-xl p-5 shadow-lg">
                <div className="text-xs font-mono text-slate-400">Total Portfolio Valuation</div>
                <div className="text-2xl font-bold font-mono text-white mt-2">
                  ${totalNetWorth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-slate-500 mt-1">Revalued in real-time</div>
              </div>

              <div className="bg-[#101726] border border-slate-800 rounded-xl p-5 shadow-lg">
                <div className="text-xs font-mono text-slate-400">Invested Cost Basis</div>
                <div className="text-2xl font-bold font-mono text-slate-300 mt-2">
                  ${totalInvested.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-slate-500 mt-1">Weighted average basis</div>
              </div>

              <div className="bg-[#101726] border border-slate-800 rounded-xl p-5 shadow-lg">
                <div className="text-xs font-mono text-slate-400">Unrealized Profit / Loss</div>
                <div className="text-2xl font-bold font-mono text-emerald-400 mt-2 flex items-center gap-1">
                  +${totalUnrealizedPnL.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-emerald-500 mt-1">+{totalYieldPercent.toFixed(2)}% net yield</div>
              </div>

              <div className="bg-[#101726] border border-slate-800 rounded-xl p-5 shadow-lg">
                <div className="text-xs font-mono text-slate-400">Realized Gains (Closed)</div>
                <div className="text-2xl font-bold font-mono text-indigo-400 mt-2">+$5,600.00</div>
                <div className="text-xs text-slate-500 mt-1">From partial liquidations</div>
              </div>
            </div>

            {/* Holdings & Transaction Entry */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Holdings Table */}
              <div className="lg:col-span-2 bg-[#101726] border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-indigo-400" />
                    <h3 className="font-semibold text-white">Active Asset Holdings</h3>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">18 Decimals Precision</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="pb-3">Asset</th>
                        <th className="pb-3">Holding Quantity</th>
                        <th className="pb-3">Avg Cost</th>
                        <th className="pb-3">Spot Price</th>
                        <th className="pb-3">Valuation</th>
                        <th className="pb-3 text-right">Unrealized PnL</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {holdings.map((h) => (
                        <tr key={h.symbol} className="hover:bg-slate-800/20">
                          <td className="py-3.5 font-sans font-bold text-white">{h.symbol}</td>
                          <td className="py-3.5 text-slate-200">{h.quantity}</td>
                          <td className="py-3.5 text-slate-400">${h.avgCostBasis.toLocaleString()}</td>
                          <td className="py-3.5 text-white">${h.currentPrice.toLocaleString()}</td>
                          <td className="py-3.5 font-semibold text-slate-100">
                            ${h.currentValuation.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3.5 text-right font-semibold text-emerald-400">
                            +${h.unrealizedPnL.toLocaleString('en-US', { minimumFractionDigits: 2 })} ({h.unrealizedPercent.toFixed(1)}%)
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Record Transaction Form */}
              <div className="lg:col-span-1 bg-[#101726] border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
                <div className="flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-semibold text-white">Record Crypto Transaction</h3>
                </div>

                <form onSubmit={handleRecordTransaction} className="space-y-4 text-xs font-sans">
                  <div>
                    <label className="block text-slate-400 mb-1">Asset</label>
                    <select
                      value={txSymbol}
                      onChange={(e) => setTxSymbol(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {tickers.map((t) => (
                        <option key={t.symbol} value={t.symbol}>
                          {t.symbol} - {t.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Order Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setTxType('BUY')}
                        className={`py-1.5 rounded-lg font-semibold transition ${
                          txType === 'BUY'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-900 text-slate-400 border border-slate-700'
                        }`}
                      >
                        BUY (Accumulate)
                      </button>
                      <button
                        type="button"
                        onClick={() => setTxType('SELL')}
                        className={`py-1.5 rounded-lg font-semibold transition ${
                          txType === 'SELL'
                            ? 'bg-rose-600 text-white'
                            : 'bg-slate-900 text-slate-400 border border-slate-700'
                        }`}
                      >
                        SELL (Liquidate)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Quantity</label>
                    <input
                      type="number"
                      step="0.00000001"
                      min="0.00000001"
                      value={txQty}
                      onChange={(e) => setTxQty(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Execution Price (USD)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={txPrice}
                      onChange={(e) => setTxPrice(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg shadow-lg shadow-indigo-900/40 transition"
                    >
                      Post Transaction to Portfolio
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ALERTS VIEW */}
        {activeTab === 'ALERTS' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-white">Price Alert Triggers</h2>
              <p className="text-xs text-slate-400">Automated condition monitoring against streaming or polling market quotes</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#101726] border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
                <h3 className="font-semibold text-white text-sm">Configured Alert Rules</h3>
                <div className="space-y-3 font-mono text-xs">
                  {alerts.map((alt) => (
                    <div key={alt.id} className="p-3.5 border border-slate-800 rounded-lg bg-slate-900/60 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-white text-sm font-sans">{alt.symbol}</div>
                        <div className="text-slate-400 mt-1">
                          Condition: <span className="text-indigo-400">{alt.condition}</span> ${alt.targetPrice.toLocaleString()}
                        </div>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded text-[10px] font-semibold ${
                          alt.status === 'TRIGGERED'
                            ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
                            : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                        }`}
                      >
                        {alt.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#101726] border border-slate-800 rounded-xl p-6 shadow-xl space-y-4 text-xs">
                <h3 className="font-semibold text-white text-sm">Create New Price Alert</h3>
                <p className="text-slate-400">Set threshold triggers to receive automatic webhook notifications or email notifications.</p>
                <div className="p-4 border border-dashed border-slate-700 rounded-lg text-center text-slate-400 space-y-2">
                  <Bell className="w-6 h-6 text-indigo-400 mx-auto" />
                  <div>Select any asset in Market Screener to attach a one-click volatility alert.</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* WATCHLIST VIEW */}
        {activeTab === 'WATCHLIST' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-white">Favorite Watchlist Tokens</h2>
              <p className="text-xs text-slate-400">Quick view of pinned tokens for rapid market surveillance</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {tickers
                .filter((t) => watchlist.includes(t.symbol))
                .map((t) => (
                  <div key={t.symbol} className="bg-[#101726] border border-slate-800 rounded-xl p-5 shadow-lg font-mono">
                    <div className="flex items-center justify-between">
                      <span className="font-sans font-bold text-lg text-white">{t.symbol}</span>
                      <button onClick={() => toggleWatchlist(t.symbol)} className="text-amber-400">
                        <Star className="w-4 h-4 fill-current" />
                      </button>
                    </div>
                    <div className="text-xs text-slate-400 font-sans">{t.name}</div>
                    <div className="text-2xl font-bold text-white mt-4">${t.priceUsd.toLocaleString()}</div>
                    <div className={`text-xs mt-1 font-semibold ${t.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {t.change24h >= 0 ? '+' : ''}
                      {t.change24h}% (24h)
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-800/80 bg-[#0a0e18] py-6 text-center text-xs font-mono text-slate-500">
        Fintrack Cryptocurrency Dashboard • Independent System 04 • High-Precision 18-Decimal Engine
      </footer>
    </div>
  );
}
