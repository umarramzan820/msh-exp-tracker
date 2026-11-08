import React, { useMemo } from 'react';
import { 
  Receipt, 
  HandCoins, 
  ArrowDownLeft, 
  ArrowUpRight, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  ChevronRight, 
  Plus, 
  ShieldCheck, 
  Layers, 
  BarChart3, 
  Mail, 
  Database,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { formatCurrency, formatRelativeDate, formatDate } from '../../utils/formatters';
import { calculateCreditMetrics } from '../../db/db';
import { aggregateExpensesByCategory, getMonthDateRange } from '../../utils/analytics';

export default function HomeHubView({
  expenses = [],
  categories = [],
  credits = [],
  currency = 'PKR',
  selectedMonth,
  activeMonthLabel,
  onNavigateTab,
  onOpenAddExpense,
  onOpenAddCredit
}) {
  // Current month expense data
  const monthDateRange = useMemo(() => getMonthDateRange(selectedMonth), [selectedMonth]);
  
  const currentMonthExpenses = useMemo(() => {
    return expenses.filter(e => e.date >= monthDateRange.startDateStr && e.date <= monthDateRange.endDateStr);
  }, [expenses, monthDateRange]);

  const monthTotalSpent = useMemo(() => {
    return currentMonthExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  }, [currentMonthExpenses]);

  // Today's spend
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const todaySpent = useMemo(() => {
    return expenses
      .filter(e => e.date === todayStr)
      .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  }, [expenses, todayStr]);

  // Category breakdown for current month
  const categoryAgg = useMemo(() => {
    return aggregateExpensesByCategory(currentMonthExpenses, categories, 'consolidated');
  }, [currentMonthExpenses, categories]);

  const topCategory = categoryAgg.items[0] || null;

  // Credit & Debt metrics
  const creditMetrics = useMemo(() => {
    return calculateCreditMetrics(credits);
  }, [credits]);

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      {/* Executive Welcome & Financial Pulse */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                Unified Financial Suite
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Executive Financial Hub
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Centralized view of daily outflow expenses, active committee schedules, and personal loan ledgers with zero-latency IndexedDB persistence.
            </p>
          </div>

          {/* Quick Net Position Badge */}
          <div className="self-start md:self-auto p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 shrink-0">
            <span className="text-[11px] text-slate-400 block uppercase tracking-wider font-semibold">
              Net Credit / Debt Position
            </span>
            <span className={`text-xl sm:text-2xl font-black ${
              creditMetrics.netBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {formatCurrency(creditMetrics.netBalance, currency)}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              {creditMetrics.netBalance >= 0 ? 'In your favor (Receivable surplus)' : 'Net debt liability'}
            </span>
          </div>
        </div>
      </div>

      {/* TWO PRIMARY EXECUTIVE INTERACTIVE CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CARD 1: EXPENSE TRACKER HUB */}
        <div className="glass-card rounded-3xl p-6 border border-slate-800/90 shadow-xl flex flex-col justify-between hover:border-slate-700 transition-all group">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 text-emerald-400 flex items-center justify-center font-bold shadow-md shadow-emerald-500/10">
                  <Receipt className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white group-hover:text-emerald-300 transition-colors">
                    Expense Tracker
                  </h3>
                  <span className="text-xs text-slate-400">{activeMonthLabel} Overview</span>
                </div>
              </div>

              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {currentMonthExpenses.length} Transactions
              </span>
            </div>

            {/* Total Spent Stat */}
            <div className="my-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Month Total Outflow
              </span>
              <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                {formatCurrency(monthTotalSpent, currency)}
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800/80 text-xs">
                <span className="text-slate-400">Today's Outflow: <strong className="text-white">{formatCurrency(todaySpent, currency)}</strong></span>
                {topCategory && (
                  <span className="text-slate-400 truncate max-w-[180px]">
                    Top: <strong className="text-emerald-400">{topCategory.name}</strong> ({topCategory.percentage}%)
                  </span>
                )}
              </div>
            </div>

            {/* Category Distribution Highlights */}
            {categoryAgg.items.length > 0 && (
              <div className="space-y-2 mb-4">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Top Spending Categories
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {categoryAgg.items.slice(0, 4).map(item => (
                    <div key={item.id} className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-850 flex items-center justify-between">
                      <div className="flex items-center gap-2 truncate">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-xs font-semibold text-slate-200 truncate">{item.name}</span>
                      </div>
                      <span className="text-xs font-bold text-white shrink-0 ml-1">
                        {formatCurrency(item.amount, currency)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action CTAs */}
          <div className="pt-4 border-t border-slate-800 flex items-center gap-3">
            <button
              onClick={onOpenAddExpense}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-600 hover:to-teal-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4 stroke-[3]" /> Quick Add Expense
            </button>
            <button
              onClick={() => onNavigateTab('expenses')}
              className="flex items-center gap-1.5 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-400 text-xs font-bold border border-slate-700/80 transition-colors"
            >
              <span>Explore</span> <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* CARD 2: CREDIT & DEBT MANAGER HUB */}
        <div className="glass-card rounded-3xl p-6 border border-slate-800/90 shadow-xl flex flex-col justify-between hover:border-slate-700 transition-all group">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-rose-500/20 text-amber-400 flex items-center justify-center font-bold shadow-md shadow-amber-500/10">
                  <HandCoins className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white group-hover:text-amber-300 transition-colors">
                    Credit &amp; Debt Manager
                  </h3>
                  <span className="text-xs text-slate-400">Receivables, Payables &amp; Committees</span>
                </div>
              </div>

              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {credits.length} Accounts
              </span>
            </div>

            {/* Split Balance Box: Lena hai vs Dena hai */}
            <div className="my-4 grid grid-cols-2 gap-3">
              {/* Receivable Box (Lena hai) */}
              <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                  Receivable (Lena hai)
                </span>
                <span className="text-xl sm:text-2xl font-black text-emerald-400 block">
                  {formatCurrency(creditMetrics.totalReceivable, currency)}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Money to be collected
                </span>
              </div>

              {/* Payable Box (Dena hai) */}
              <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30">
                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  Payable (Dena hai)
                </span>
                <span className="text-xl sm:text-2xl font-black text-rose-400 block">
                  {formatCurrency(creditMetrics.totalPayable, currency)}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Debts &amp; Committees
                </span>
              </div>
            </div>

            {/* Upcoming Due Alerts Ticker */}
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1.5 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" /> Due Alerts
                </span>
                <span className="text-[10px] text-slate-400">
                  Peak: <strong className="text-amber-300">{formatCurrency(creditMetrics.overallPeakAmount, currency)}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                {creditMetrics.overdueCount > 0 ? (
                  <span className="text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> {creditMetrics.overdueCount} Overdue ({formatCurrency(creditMetrics.overdueAmount, currency)})
                  </span>
                ) : (
                  <span className="text-emerald-400 font-medium">No overdue accounts</span>
                )}
                {creditMetrics.dueThisWeekCount > 0 && (
                  <span className="text-amber-300 font-bold bg-amber-500/10 px-2 py-0.5 rounded-md">
                    {creditMetrics.dueThisWeekCount} due this week
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="pt-4 border-t border-slate-800 flex items-center gap-3">
            <button
              onClick={onOpenAddCredit}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-bold text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4 stroke-[3]" /> + Record Credit / Debt
            </button>
            <button
              onClick={() => onNavigateTab('credit')}
              className="flex items-center gap-1.5 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-bold border border-slate-700/80 transition-colors"
            >
              <span>Ledger</span> <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* QUICK EXECUTIVE SHORTCUTS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => onNavigateTab('reports')}
          className="p-4 rounded-2xl glass-card border border-slate-800 hover:border-emerald-500/40 text-left transition-all group"
        >
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 w-fit mb-2 group-hover:scale-105 transition-transform">
            <BarChart3 className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-sm text-white">Visual Reports</h4>
          <p className="text-xs text-slate-400 mt-0.5">Cash flow vs Credit charts</p>
        </button>

        <button
          onClick={() => onNavigateTab('categories')}
          className="p-4 rounded-2xl glass-card border border-slate-800 hover:border-emerald-500/40 text-left transition-all group"
        >
          <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 w-fit mb-2 group-hover:scale-105 transition-transform">
            <Layers className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-sm text-white">Categories</h4>
          <p className="text-xs text-slate-400 mt-0.5">Multi-level subcategories</p>
        </button>

        <button
          onClick={() => onNavigateTab('settings')}
          className="p-4 rounded-2xl glass-card border border-slate-800 hover:border-emerald-500/40 text-left transition-all group"
        >
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 w-fit mb-2 group-hover:scale-105 transition-transform">
            <Mail className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-sm text-white">Email Backup</h4>
          <p className="text-xs text-slate-400 mt-0.5">1-click send database</p>
        </button>

        <button
          onClick={() => onNavigateTab('settings')}
          className="p-4 rounded-2xl glass-card border border-slate-800 hover:border-emerald-500/40 text-left transition-all group"
        >
          <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 w-fit mb-2 group-hover:scale-105 transition-transform">
            <Database className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-sm text-white">Cloud &amp; Storage</h4>
          <p className="text-xs text-slate-400 mt-0.5">Dexie IndexedDB &amp; Sync</p>
        </button>
      </div>
    </div>
  );
}
