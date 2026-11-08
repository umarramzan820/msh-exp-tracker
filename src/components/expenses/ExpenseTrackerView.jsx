import React, { useMemo } from 'react';
import { 
  Receipt, 
  Calendar, 
  TrendingUp, 
  Layers, 
  Plus, 
  ChevronRight,
  FolderTree
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { aggregateExpensesByCategory, getMonthDateRange } from '../../utils/analytics';
import ExpensesListView from './ExpensesListView';

export default function ExpenseTrackerView({
  expenses = [],
  activeExpenses = [],
  categories = [],
  currency = 'PKR',
  selectedMonth,
  activeMonthLabel,
  onOpenAddExpense,
  onOpenCategoryManager,
  onEditExpense,
  onDeleteExpense
}) {
  // Today's Outflow
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const todaySpent = useMemo(() => {
    return expenses
      .filter(e => e.date === todayStr)
      .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  }, [expenses, todayStr]);

  // Current Month Total Outflow
  const monthDateRange = useMemo(() => getMonthDateRange(selectedMonth), [selectedMonth]);
  const monthExpenses = useMemo(() => {
    return expenses.filter(e => e.date >= monthDateRange.startDateStr && e.date <= monthDateRange.endDateStr);
  }, [expenses, monthDateRange]);

  const monthTotalSpent = useMemo(() => {
    return monthExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  }, [monthExpenses]);

  // Top spending category for active month
  const categoryAgg = useMemo(() => {
    return aggregateExpensesByCategory(monthExpenses, categories, 'consolidated');
  }, [monthExpenses, categories]);

  const topCategory = categoryAgg.items[0] || null;

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Expense Tracker
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Isolated Module
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Hierarchical subcategories, date grouping, monthly isolation, and bulk operations
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenCategoryManager}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-300 transition-colors"
          >
            <FolderTree className="w-3.5 h-3.5 text-teal-400" /> Categories &amp; Hierarchy
          </button>

          <button
            onClick={onOpenAddExpense}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/25 active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" /> Add Expense
          </button>
        </div>
      </div>

      {/* 3 Clean Summary Cards (Today, This Month, Highest Spending Category) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Today */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Today's Spend</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-1">
            {formatCurrency(todaySpent, currency)}
          </div>
          <p className="text-xs text-slate-400">
            Recorded today ({new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})
          </p>
        </div>

        {/* Card 2: This Month */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">{activeMonthLabel} Total</span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-1">
            {formatCurrency(monthTotalSpent, currency)}
          </div>
          <p className="text-xs text-slate-400">
            {monthExpenses.length} transactions logged
          </p>
        </div>

        {/* Card 3: Highest Spending Category */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Highest Category</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-400 tracking-tight mb-1 truncate">
            {topCategory ? topCategory.name : 'None'}
          </div>
          <p className="text-xs text-slate-400">
            {topCategory 
              ? `${formatCurrency(topCategory.amount, currency)} (${topCategory.percentage}% of month)`
              : 'No expenses this month'}
          </p>
        </div>
      </div>

      {/* Filterable, Searchable Expense History List with Multi-Select & Bulk Delete */}
      <ExpensesListView
        expenses={activeExpenses}
        categories={categories}
        currency={currency}
        onOpenAddModal={onOpenAddExpense}
        onEditExpense={onEditExpense}
        onDeleteExpense={onDeleteExpense}
      />
    </div>
  );
}
