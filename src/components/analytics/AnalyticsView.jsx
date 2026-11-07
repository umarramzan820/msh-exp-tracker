import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  ArrowUpRight, 
  ArrowDownRight, 
  ChevronRight, 
  Layers, 
  Split, 
  Combine, 
  ArrowLeft,
  CalendarDays,
  Globe
} from 'lucide-react';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import '../../utils/chartConfig';
import { formatCurrency } from '../../utils/formatters';
import { 
  calculateWoW, 
  calculateMoM, 
  aggregateExpensesByCategory, 
  calculateSpendingTrend, 
  calculateComparativeCategories,
  filterExpensesByDateRange
} from '../../utils/analytics';

export default function AnalyticsView({
  expenses,
  activeExpenses,
  categories,
  currency,
  viewMode = 'single_month',
  selectedMonth,
  activeMonthLabel,
  dateRange
}) {
  // Category display mode: 'consolidated' (roll up to root) vs 'isolated' (exact subcategory)
  const [categoryViewMode, setCategoryViewMode] = useState('consolidated');
  // Drill-down into a specific parent category
  const [drilldownCategory, setDrilldownCategory] = useState(null);
  // Chart type for trend: 'bar' or 'line'
  const [trendChartType, setTrendChartType] = useState('bar');

  // WoW and MoM metrics
  const wow = useMemo(() => calculateWoW(expenses), [expenses]);
  const mom = useMemo(() => calculateMoM(expenses, selectedMonth), [expenses, selectedMonth]);

  // Previous period expenses for comparative dual-bar chart
  const previousPeriodExpenses = useMemo(() => {
    if (viewMode === 'single_month') {
      // Prior month
      const [year, month] = selectedMonth.split('-').map(Number);
      const priorDate = new Date(year, month - 2, 1);
      const priorYear = priorDate.getFullYear();
      const priorMonth = priorDate.getMonth() + 1;
      const daysInPrior = new Date(priorYear, priorMonth, 0).getDate();
      const priorStartStr = `${priorYear}-${String(priorMonth).padStart(2, '0')}-01`;
      const priorEndStr = `${priorYear}-${String(priorMonth).padStart(2, '0')}-${String(daysInPrior).padStart(2, '0')}`;
      return filterExpensesByDateRange(expenses, priorStartStr, priorEndStr);
    } else {
      // In consolidated mode, compare past 30 days vs prior 30 days
      const now = new Date();
      const past30Start = new Date(now.getTime() - 30 * 86400000).toISOString().split('T')[0];
      const past60Start = new Date(now.getTime() - 60 * 86400000).toISOString().split('T')[0];
      return filterExpensesByDateRange(expenses, past60Start, past30Start);
    }
  }, [expenses, viewMode, selectedMonth]);

  // Aggregate Category Breakdown
  const aggregation = useMemo(() => {
    return aggregateExpensesByCategory(
      activeExpenses,
      categories,
      categoryViewMode,
      drilldownCategory?.id || null
    );
  }, [activeExpenses, categories, categoryViewMode, drilldownCategory]);

  // Spending Trend
  const trend = useMemo(() => {
    return calculateSpendingTrend(
      activeExpenses,
      dateRange.startDateStr,
      dateRange.endDateStr
    );
  }, [activeExpenses, dateRange]);

  // Comparative dual-bar chart data: Active vs Prior Period per category
  const comparativeItems = useMemo(() => {
    return calculateComparativeCategories(activeExpenses, previousPeriodExpenses, categories);
  }, [activeExpenses, previousPeriodExpenses, categories]);

  // Donut chart setup
  const donutData = useMemo(() => {
    return {
      labels: aggregation.items.map(i => i.name),
      datasets: [
        {
          data: aggregation.items.map(i => i.amount),
          backgroundColor: aggregation.items.map(i => i.color || '#10b981'),
          borderColor: '#0f172a',
          borderWidth: 2,
          hoverOffset: 8
        }
      ]
    };
  }, [aggregation]);

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
            const item = aggregation.items[context.dataIndex];
            return ` ${context.label}: ${formatCurrency(val, currency)} (${item?.percentage || 0}%)`;
          }
        }
      }
    },
    cutout: '68%'
  };

  // Comparative dual-bar chart setup
  const comparativeChartData = useMemo(() => {
    const topComparisons = comparativeItems.slice(0, 7);
    return {
      labels: topComparisons.map(i => i.category),
      datasets: [
        {
          label: viewMode === 'single_month' ? activeMonthLabel : 'Recent Period',
          data: topComparisons.map(i => i.current),
          backgroundColor: '#10b981',
          borderRadius: 6
        },
        {
          label: viewMode === 'single_month' ? 'Prior Month' : 'Previous Period',
          data: topComparisons.map(i => i.previous),
          backgroundColor: '#64748b',
          borderRadius: 6
        }
      ]
    };
  }, [comparativeItems, viewMode, activeMonthLabel]);

  const comparativeChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { font: { size: 11 }, color: '#cbd5e1', boxWidth: 12 }
      },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${ctx.dataset.label}: ${formatCurrency(ctx.raw, currency)}`
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 }, color: '#94a3b8' }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { font: { size: 10 }, color: '#64748b' }
      }
    }
  };

  // Trend Chart (Bar or Line)
  const trendData = useMemo(() => {
    return {
      labels: trend.labels,
      datasets: [
        {
          label: 'Spend',
          data: trend.data,
          borderColor: '#34d399',
          backgroundColor: trendChartType === 'line' ? 'rgba(52, 211, 153, 0.15)' : '#10b981',
          borderRadius: 6,
          fill: true,
          tension: 0.35
        }
      ]
    };
  }, [trend, trendChartType]);

  const trendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => ` Spent: ${formatCurrency(ctx.raw, currency)}`
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
        ticks: { font: { size: 10 }, color: '#64748b' }
      }
    }
  };

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      {/* Header & Category Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-black text-white tracking-tight">
              Visual Analytics &amp; Trends
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
            Comparative performance, distribution charts, and multi-level drilldowns
          </p>
        </div>

        {/* View Mode Toggle: Consolidated vs Isolated Categories */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-700/80 rounded-2xl self-start sm:self-auto">
          <button
            onClick={() => {
              setCategoryViewMode('consolidated');
              setDrilldownCategory(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              categoryViewMode === 'consolidated' && !drilldownCategory
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Combine className="w-3.5 h-3.5" /> Consolidated Categories
          </button>
          <button
            onClick={() => {
              setCategoryViewMode('isolated');
              setDrilldownCategory(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              categoryViewMode === 'isolated' && !drilldownCategory
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Split className="w-3.5 h-3.5" /> Isolated Subcategories
          </button>
        </div>
      </div>

      {/* Comparative Cards: WoW & MoM */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* WoW Card */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Week-over-Week (WoW) Comparison
            </span>
            <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-lg ${
              wow.percentChange > 0 
                ? 'bg-rose-500/15 text-rose-400' 
                : wow.percentChange < 0 
                ? 'bg-emerald-500/15 text-emerald-400' 
                : 'bg-slate-800 text-slate-400'
            }`}>
              {wow.percentChange > 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              {wow.percentChange > 0 ? `+${wow.percentChange}%` : `${wow.percentChange}%`}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[11px] text-slate-400">Current Week</p>
              <p className="text-xl font-black text-white">{formatCurrency(wow.thisWeekTotal, currency)}</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400">Prior Week</p>
              <p className="text-xl font-bold text-slate-400">{formatCurrency(wow.lastWeekTotal, currency)}</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 text-xs text-slate-400">
            {wow.difference > 0 ? (
              <span className="text-rose-400 font-semibold">Spending increased by {formatCurrency(Math.abs(wow.difference), currency)}</span>
            ) : (
              <span className="text-emerald-400 font-semibold">Spending reduced by {formatCurrency(Math.abs(wow.difference), currency)}</span>
            )}
          </div>
        </div>

        {/* MoM Card */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Month-over-Month (MoM) Comparison
            </span>
            <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-lg ${
              mom.percentChange > 0 
                ? 'bg-rose-500/15 text-rose-400' 
                : mom.percentChange < 0 
                ? 'bg-emerald-500/15 text-emerald-400' 
                : 'bg-slate-800 text-slate-400'
            }`}>
              {mom.percentChange > 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              {mom.percentChange > 0 ? `+${mom.percentChange}%` : `${mom.percentChange}%`}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[11px] text-slate-400">
                {viewMode === 'single_month' ? activeMonthLabel : 'Current Month'}
              </p>
              <p className="text-xl font-black text-white">{formatCurrency(mom.thisMonthTotal, currency)}</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400">Prior Month</p>
              <p className="text-xl font-bold text-slate-400">{formatCurrency(mom.lastMonthTotal, currency)}</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 text-xs text-slate-400">
            Daily Average Spend: <strong className="text-white">{formatCurrency(mom.dailyAverage, currency)}/day</strong>
          </div>
        </div>
      </div>

      {/* Interactive Distribution Donut & Drill-down strictly scoped */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Donut Chart with Drill-down indicator */}
        <div className="lg:col-span-3 glass-card rounded-2xl p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {drilldownCategory && (
                <button
                  onClick={() => setDrilldownCategory(null)}
                  className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 transition-colors"
                  title="Back to all categories"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <div>
                <h3 className="font-bold text-sm text-white">
                  {drilldownCategory ? `${drilldownCategory.name} Subcategories` : 'Category Distribution'}
                </h3>
                <p className="text-xs text-slate-400">
                  {drilldownCategory ? 'Sub-tier expense proportion' : `Scoped to ${activeMonthLabel}`}
                </p>
              </div>
            </div>

            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl">
              {formatCurrency(aggregation.grandTotal, currency)}
            </span>
          </div>

          <div className="flex-1 min-h-[260px] relative flex items-center justify-center">
            {aggregation.items.length > 0 ? (
              <Doughnut data={donutData} options={donutOptions} />
            ) : (
              <div className="text-center text-slate-500 text-xs py-8">
                No expense data recorded in this period
              </div>
            )}
          </div>
        </div>

        {/* Right: Interactive Category Drill-down list */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-5 flex flex-col">
          <h3 className="font-bold text-sm text-white mb-1">
            {drilldownCategory ? `Drilldown: ${drilldownCategory.name}` : 'Categories Hierarchy'}
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Tap any parent to inspect child subcategories
          </p>

          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[300px]">
            {aggregation.items.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  if (!drilldownCategory) {
                    setDrilldownCategory(item);
                  }
                }}
                className="w-full text-left p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800/80 hover:border-slate-700 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <div className="truncate">
                    <p className="text-xs font-bold text-white truncate">{item.name}</p>
                    <p className="text-[10px] text-slate-400">{item.count} expenses</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-200">
                      {formatCurrency(item.amount, currency)}
                    </span>
                    <span className="block text-[10px] text-emerald-400 font-semibold">
                      {item.percentage}%
                    </span>
                  </div>
                  {!drilldownCategory && (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                  )}
                </div>
              </button>
            ))}

            {aggregation.items.length === 0 && (
              <p className="text-center text-slate-500 text-xs py-6">No data</p>
            )}
          </div>
        </div>
      </div>

      {/* Comparative Dual-Bar Chart: Active vs Prior Period per Category */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              Comparative Period Analysis (Dual-Bar Chart)
            </h3>
            <p className="text-xs text-slate-400">
              Direct side-by-side comparison between {activeMonthLabel} and prior period
            </p>
          </div>
          <span className="text-xs text-slate-400 bg-slate-800 px-2.5 py-1 rounded-xl">
            Side-by-side
          </span>
        </div>

        <div className="h-72 relative">
          {comparativeItems.length > 0 ? (
            <Bar data={comparativeChartData} options={comparativeChartOptions} />
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500 text-xs">
              No comparative data for this selection
            </div>
          )}
        </div>
      </div>

      {/* Spending Trend over Time */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-sm text-white">Daily Spending Trajectory</h3>
            <p className="text-xs text-slate-400">
              Track daily expenses across {activeMonthLabel}
            </p>
          </div>

          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setTrendChartType('bar')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                trendChartType === 'bar' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'
              }`}
            >
              Bar
            </button>
            <button
              onClick={() => setTrendChartType('line')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                trendChartType === 'line' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'
              }`}
            >
              Line
            </button>
          </div>
        </div>

        <div className="h-64 relative">
          {trendChartType === 'line' ? (
            <Line data={trendData} options={trendOptions} />
          ) : (
            <Bar data={trendData} options={trendOptions} />
          )}
        </div>
      </div>
    </div>
  );
}
