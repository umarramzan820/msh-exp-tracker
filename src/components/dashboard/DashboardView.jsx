import React, { useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Receipt, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight, 
  Clock, 
  Layers, 
  ChevronRight,
  CalendarDays,
  Globe
} from 'lucide-react';
import { Doughnut, Line } from 'react-chartjs-2';
import '../../utils/chartConfig';
import { formatCurrency, formatRelativeDate, getPaymentMethodInfo } from '../../utils/formatters';
import { calculateWoW, calculateMoM, aggregateExpensesByCategory, calculateSpendingTrend } from '../../utils/analytics';
import IconRenderer from '../common/IconRenderer';

export default function DashboardView({
  expenses,
  categories,
  activeExpenses,
  viewMode = 'single_month',
  selectedMonth,
  activeMonthLabel,
  dateRange,
  currency,
  onOpenAddModal,
  onViewAllExpenses,
  onNavigateToAnalytics
}) {
  // WoW calculation based on current state
  const wow = useMemo(() => calculateWoW(expenses), [expenses]);
  // MoM calculation strictly evaluated against selected month in single_month mode
  const mom = useMemo(() => calculateMoM(expenses, selectedMonth), [expenses, selectedMonth]);

  // Aggregate active expenses strictly
  const categoryAggregation = useMemo(() => {
    return aggregateExpensesByCategory(activeExpenses, categories, 'consolidated');
  }, [activeExpenses, categories]);

  // Spending Trend for the active scope
  const trend = useMemo(() => {
    return calculateSpendingTrend(
      activeExpenses,
      dateRange.startDateStr,
      dateRange.endDateStr
    );
  }, [activeExpenses, dateRange]);

  // Daily average for active scope
  const activeDailyAverage = useMemo(() => {
    if (viewMode === 'single_month') {
      return mom.dailyAverage;
    }
    // Consolidated: total / unique days or total days
    const uniqueDates = new Set(expenses.map(e => e.date)).size;
    const total = expenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
    return uniqueDates > 0 ? total / uniqueDates : total;
  }, [viewMode, mom.dailyAverage, expenses]);

  // Chart: Donut Data strictly scoped to active view
  const donutData = useMemo(() => {
    const topItems = categoryAggregation.items.slice(0, 6);
    return {
      labels: topItems.map(i => i.name),
      datasets: [
        {
          data: topItems.map(i => i.amount),
          backgroundColor: topItems.map(i => i.color || '#10b981'),
          borderColor: '#0f172a',
          borderWidth: 2,
          hoverOffset: 6
        }
      ]
    };
  }, [categoryAggregation]);

  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          boxWidth: 12,
          font: { size: 11 },
          color: '#cbd5e1'
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const val = context.raw || 0;
            return ` ${context.label}: ${formatCurrency(val, currency)}`;
          }
        }
      }
    },
    cutout: '72%'
  };

  // Chart: Trend Line Data strictly scoped
  const lineData = useMemo(() => {
    return {
      labels: trend.labels,
      datasets: [
        {
          label: 'Daily Spend',
          data: trend.data,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.12)',
          fill: true,
          tension: 0.35,
          pointRadius: 3,
          pointHoverRadius: 6,
          pointBackgroundColor: '#10b981',
          pointBorderColor: '#ffffff'
        }
      ]
    };
  }, [trend]);

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => ` Spent: ${formatCurrency(context.raw, currency)}`
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 10 }, color: '#64748b' }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: {
          font: { size: 10 },
          color: '#64748b',
          callback: (val) => `${val}`
        }
      }
    }
  };

  const categoryMap = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories]);
  const recentExpenses = useMemo(() => {
    return [...activeExpenses].sort((a, b) => (b.date > a.date ? 1 : -1)).slice(0, 5);
  }, [activeExpenses]);

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      {/* Top Welcome / Active Scope Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-black text-white tracking-tight">
              Financial Overview
            </h2>
            <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              {viewMode === 'single_month' ? (
                <>
                  <CalendarDays className="w-3 h-3" />
                  <span>{activeMonthLabel}</span>
                </>
              ) : (
                <>
                  <Globe className="w-3 h-3" />
                  <span>All-Time Consolidated</span>
                </>
              )}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            {viewMode === 'single_month'
              ? `Strictly isolated metrics for ${activeMonthLabel}`
              : 'All historical expenses consolidated across all months'}
          </p>
        </div>

        <button
          onClick={onOpenAddModal}
          className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-500/25 transition-all"
        >
          <Receipt className="w-4 h-4" /> Quick Expense Entry
        </button>
      </div>

      {/* 4 Metric Cards Grid - Strictly Dynamically Recalculated */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Total Spent */}
        <div className="glass-card rounded-2xl p-4 sm:p-5 relative overflow-hidden group hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              {viewMode === 'single_month' ? 'Month Total Spent' : 'Total Spent (All-Time)'}
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-1">
            {formatCurrency(categoryAggregation.grandTotal, currency)}
          </div>
          <p className="text-xs text-slate-400 flex items-center gap-1.5">
            <span>{viewMode === 'single_month' ? activeMonthLabel : 'Consolidated View'}</span>
            <span>• {activeExpenses.length} entries</span>
          </p>
        </div>

        {/* Card 2: Week-over-Week (WoW) */}
        <div className="glass-card rounded-2xl p-4 sm:p-5 relative overflow-hidden group hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Week-over-Week</span>
            <div className={`p-2 rounded-xl ${wow.isIncrease ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
              {wow.isIncrease ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-1">
            {formatCurrency(wow.thisWeekTotal, currency)}
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className={`inline-flex items-center gap-0.5 font-bold px-1.5 py-0.5 rounded ${
              wow.percentChange > 0 
                ? 'bg-rose-500/15 text-rose-400' 
                : wow.percentChange < 0 
                ? 'bg-emerald-500/15 text-emerald-400' 
                : 'bg-slate-800 text-slate-400'
            }`}>
              {wow.percentChange > 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              {Math.abs(wow.percentChange)}%
            </span>
            <span className="text-slate-400 text-[11px]">vs last week</span>
          </div>
        </div>

        {/* Card 3: Month-over-Month (MoM) dynamically calculated */}
        <div className="glass-card rounded-2xl p-4 sm:p-5 relative overflow-hidden group hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              {viewMode === 'single_month' ? 'MoM vs Prior Month' : 'Recent Month Delta'}
            </span>
            <div className={`p-2 rounded-xl ${mom.isIncrease ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
              {mom.isIncrease ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-1">
            {formatCurrency(mom.thisMonthTotal, currency)}
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className={`inline-flex items-center gap-0.5 font-bold px-1.5 py-0.5 rounded ${
              mom.percentChange > 0 
                ? 'bg-rose-500/15 text-rose-400' 
                : mom.percentChange < 0 
                ? 'bg-emerald-500/15 text-emerald-400' 
                : 'bg-slate-800 text-slate-400'
            }`}>
              {mom.percentChange > 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              {Math.abs(mom.percentChange)}%
            </span>
            <span className="text-slate-400 text-[11px]">
              {mom.lastMonthTotal > 0 ? `vs ${formatCurrency(mom.lastMonthTotal, currency)}` : 'first period'}
            </span>
          </div>
        </div>

        {/* Card 4: Daily Average */}
        <div className="glass-card rounded-2xl p-4 sm:p-5 relative overflow-hidden group hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Daily Average</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-1">
            {formatCurrency(activeDailyAverage, currency)}
          </div>
          <p className="text-xs text-slate-400">
            {viewMode === 'single_month' ? `Daily spend in ${activeMonthLabel}` : 'Overall daily burn rate'}
          </p>
        </div>
      </div>

      {/* Visual Analytics Grid: Donut + Spending Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Category Distribution Donut strictly for active scope */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-white">Expense Distribution</h3>
              <p className="text-xs text-slate-400">
                {viewMode === 'single_month' ? `${activeMonthLabel} breakdown` : 'Consolidated all categories'}
              </p>
            </div>
            <button
              onClick={onNavigateToAnalytics}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
            >
              Details <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 min-h-[220px] relative flex items-center justify-center">
            {categoryAggregation.items.length > 0 ? (
              <Doughnut data={donutData} options={donutOptions} />
            ) : (
              <div className="text-center text-slate-500 text-xs py-8">
                No expense data recorded for this month
              </div>
            )}
          </div>
        </div>

        {/* Spending Trend Line Chart */}
        <div className="lg:col-span-3 glass-card rounded-2xl p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-white">Spending Trend</h3>
              <p className="text-xs text-slate-400">
                {viewMode === 'single_month' ? `Daily spend across ${activeMonthLabel}` : 'Spending across dates'}
              </p>
            </div>
            <span className="text-xs font-medium text-slate-400 px-2 py-0.5 rounded-lg bg-slate-800">
              Daily
            </span>
          </div>

          <div className="flex-1 min-h-[220px] relative">
            {trend.data.length > 0 ? (
              <Line data={lineData} options={lineOptions} />
            ) : (
              <div className="text-center text-slate-500 text-xs py-8">
                No trend data available for this selection
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Category Breakdown Progress Bars */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-sm text-white">Category Spending Breakdown</h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            {viewMode === 'single_month' ? `${activeMonthLabel} Totals` : 'All-Time Totals'}
          </span>
        </div>

        <div className="space-y-3.5">
          {categoryAggregation.items.slice(0, 6).map((item) => (
            <div key={item.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.name}
                  <span className="text-[11px] text-slate-400 font-normal">({item.count} items)</span>
                </span>
                <span className="font-bold text-white">
                  {formatCurrency(item.amount, currency)}{' '}
                  <span className="text-slate-400 font-normal">({item.percentage}%)</span>
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800/80 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(item.percentage, 100)}%`,
                    backgroundColor: item.color || '#10b981'
                  }}
                />
              </div>
            </div>
          ))}

          {categoryAggregation.items.length === 0 && (
            <p className="text-center text-slate-500 text-xs py-4">
              No categories recorded for this month
            </p>
          )}
        </div>
      </div>

      {/* Recent Transactions in this Active Month */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-sm text-white">
              {viewMode === 'single_month' ? `${activeMonthLabel} Entries` : 'Recent Transactions'}
            </h3>
          </div>
          <button
            onClick={onViewAllExpenses}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
          >
            View All ({activeExpenses.length}) <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-800/80">
          {recentExpenses.map((exp) => {
            const cat = categoryMap.get(exp.subcategoryId) || categoryMap.get(exp.categoryId);
            const parentCat = cat?.parentId ? categoryMap.get(cat.parentId) : cat;
            const pm = getPaymentMethodInfo(exp.paymentMethod);

            return (
              <div key={exp.id} className="py-3 flex items-center justify-between gap-3 group">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: `${parentCat?.color || '#10b981'}15`,
                      color: parentCat?.color || '#10b981'
                    }}
                  >
                    <IconRenderer name={parentCat?.icon || 'Tag'} className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-white truncate">
                      {exp.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <span className="text-emerald-400/90 font-medium">{cat?.name || 'Expense'}</span>
                      <span>•</span>
                      <span>{formatRelativeDate(exp.date)}</span>
                      <span>•</span>
                      <span className="text-[11px] text-slate-400">{pm.label}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-bold text-sm text-white">
                    {formatCurrency(exp.amount, currency)}
                  </div>
                  {Array.isArray(exp.tags) && exp.tags.length > 0 && (
                    <span className="text-[10px] text-slate-400">
                      #{exp.tags[0]}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {recentExpenses.length === 0 && (
            <div className="text-center py-8 text-slate-500 text-xs">
              No transactions recorded for this month. Click "+ Quick Expense Entry" to record an expense.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
