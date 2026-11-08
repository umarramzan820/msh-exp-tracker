import React, { useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { 
  BarChart3, 
  PieChart as PieIcon, 
  TrendingUp, 
  TrendingDown, 
  BadgePercent, 
  Scale, 
  Layers, 
  Calendar,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { aggregateExpensesByCategory, getAvailableMonths, getMonthDateRange } from '../../utils/analytics';
import { calculateCreditMetrics } from '../../db/db';

const PIE_COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ec4899', 
  '#8b5cf6', '#06b6d4', '#ef4444', '#14b8a6', 
  '#f97316', '#64748b'
];

export default function ReportsView({
  expenses = [],
  categories = [],
  credits = [],
  currency = 'PKR',
  selectedMonth,
  activeMonthLabel
}) {
  const creditMetrics = useMemo(() => calculateCreditMetrics(credits), [credits]);

  // Current month expenses
  const monthDateRange = useMemo(() => getMonthDateRange(selectedMonth), [selectedMonth]);
  const monthExpenses = useMemo(() => {
    return expenses.filter(e => e.date >= monthDateRange.startDateStr && e.date <= monthDateRange.endDateStr);
  }, [expenses, monthDateRange]);

  // Expense Category Donut Data
  const categoryAgg = useMemo(() => {
    return aggregateExpensesByCategory(monthExpenses.length > 0 ? monthExpenses : expenses, categories, 'consolidated');
  }, [monthExpenses, expenses, categories]);

  const pieData = useMemo(() => {
    return categoryAgg.items.slice(0, 6).map((item, idx) => ({
      name: item.name,
      value: item.amount,
      percentage: item.percentage,
      color: item.color || PIE_COLORS[idx % PIE_COLORS.length]
    }));
  }, [categoryAgg]);

  // Monthly Cash Outflow vs Credit Inflow (Multi-month comparative Bar chart)
  const availableMonths = useMemo(() => getAvailableMonths(expenses).slice(0, 5).reverse(), [expenses]);

  const cashFlowVsCreditData = useMemo(() => {
    return availableMonths.map(m => {
      const range = getMonthDateRange(m.key);
      const outflow = expenses
        .filter(e => e.date >= range.startDateStr && e.date <= range.endDateStr)
        .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

      // Estimate monthly credit inflow from receivables due or collected in that month
      const inflow = credits
        .filter(c => c.type === 'receivable')
        .reduce((sum, c) => sum + (parseFloat(c.monthlyInstallment) || (c.totalAmount / (c.tenureMonths || 1))), 0);

      const [y, mon] = m.key.split('-');
      const shortName = new Date(Number(y), Number(mon) - 1, 1).toLocaleDateString('en-US', { month: 'short' });

      return {
        month: shortName,
        Outflow: Math.round(outflow),
        Inflow: Math.round(inflow)
      };
    });
  }, [availableMonths, expenses, credits]);

  // Scheduled Committees and Installments for Amortization List
  const scheduledAccounts = useMemo(() => {
    return credits.filter(c => c.category === 'committee' || c.category === 'installment');
  }, [credits]);

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          Visual Reports &amp; Analytics
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            Recharts Engine
          </span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-400">
          Executive charts comparing cash outflow vs credit inflow, debt amortization, and category distribution.
        </p>
      </div>

      {/* Overview Stat Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-4 border border-slate-800">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Total Inflow Receivables (Lena hai)
          </span>
          <span className="text-2xl font-black text-emerald-400">
            {formatCurrency(creditMetrics.totalReceivable, currency)}
          </span>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-slate-800">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Total Outflow Liabilities (Dena hai)
          </span>
          <span className="text-2xl font-black text-rose-400">
            {formatCurrency(creditMetrics.totalPayable, currency)}
          </span>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-slate-800">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Highest Historical Credit Peak
          </span>
          <span className="text-2xl font-black text-amber-400">
            {formatCurrency(creditMetrics.overallPeakAmount, currency)}
          </span>
        </div>
      </div>

      {/* Main Charts: Outflow vs Inflow (Bar) & Category Donut (Pie) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Outflow vs Inflow Bar Chart */}
        <div className="lg:col-span-3 glass-card rounded-3xl p-5 border border-slate-800 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                Monthly Cash Outflow vs Credit Inflow
              </h3>
              <p className="text-xs text-slate-400">Comparing living expenses against credit inflows</p>
            </div>
            <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">
              Monthly Trend
            </span>
          </div>

          <div className="flex-1 h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashFlowVsCreditData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip 
                  formatter={(val) => formatCurrency(val, currency)}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="Outflow" fill="#f43f5e" name="Expense Outflow" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Inflow" fill="#10b981" name="Credit Inflow" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Category Donut Chart */}
        <div className="lg:col-span-2 glass-card rounded-3xl p-5 border border-slate-800 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-teal-400" />
                Category Distribution
              </h3>
              <p className="text-xs text-slate-400">Expense breakdown by category</p>
            </div>
          </div>

          <div className="flex-1 h-56 sm:h-64 w-full relative flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(val) => formatCurrency(val, currency)}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-500">No expense data</div>
            )}
          </div>

          {/* Readable Legends with percentages */}
          <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-slate-800/80">
            {pieData.map((item) => (
              <div key={item.name} className="flex items-center gap-2 text-xs truncate">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-slate-300 truncate text-[11px] font-medium">{item.name}</span>
                <span className="text-[10px] text-slate-500 ml-auto font-bold">{item.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Committee & Debt Amortization Progress Bars */}
      <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <BadgePercent className="w-5 h-5 text-emerald-400" />
              Committee &amp; Installment Amortization Schedules
            </h3>
            <p className="text-xs text-slate-400">
              Live tracking of paid installments, remaining balance, and tenure progress
            </p>
          </div>
          <span className="text-xs font-bold text-slate-300 bg-slate-800 px-3 py-1 rounded-full">
            {scheduledAccounts.length} Plans Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {scheduledAccounts.map(account => {
            const total = parseFloat(account.totalAmount) || 0;
            const remaining = parseFloat(account.remainingAmount) || 0;
            const monthly = parseFloat(account.monthlyInstallment) || 0;
            const progress = total > 0 ? Math.min(100, Math.round(((total - remaining) / total) * 100)) : 100;
            const paidCount = monthly > 0 ? Math.round((total - remaining) / monthly) : 0;
            const tenure = parseInt(account.tenureMonths) || (monthly > 0 ? Math.ceil(total / monthly) : 0);

            return (
              <div key={account.id} className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      {account.category}
                    </span>
                    <h4 className="font-bold text-sm text-white mt-1">{account.personName}</h4>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-white">{formatCurrency(remaining, currency)}</span>
                    <span className="text-[10px] text-slate-400 block">remaining of {formatCurrency(total, currency)}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{progress}% Completed</span>
                    <span>{paidCount} of {tenure} Installments</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                  <span>Monthly: <strong className="text-white">{formatCurrency(monthly, currency)}</strong></span>
                  {account.payoutDate && (
                    <span>Payout: <strong className="text-amber-300">{formatDate(account.payoutDate)}</strong></span>
                  )}
                  {account.dueDate && (
                    <span>Next Due: <strong className="text-slate-300">{formatDate(account.dueDate)}</strong></span>
                  )}
                </div>
              </div>
            );
          })}

          {scheduledAccounts.length === 0 && (
            <div className="col-span-full py-8 text-center text-xs text-slate-500">
              No active committees or installment plans recorded. Add one in Credit &amp; Debt Manager.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
