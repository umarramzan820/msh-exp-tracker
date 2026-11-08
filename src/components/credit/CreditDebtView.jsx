import React, { useState, useMemo } from 'react';
import { 
  HandCoins, 
  Plus, 
  Search, 
  Filter, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  BadgePercent, 
  Scale, 
  Layers, 
  ChevronRight,
  TrendingUp,
  Trash2,
  Edit3,
  BookOpen
} from 'lucide-react';
import { calculateCreditMetrics, deleteCredit } from '../../db/db';
import { formatCurrency, formatDate, formatRelativeDate } from '../../utils/formatters';
import CreditModal from './CreditModal';
import CreditLedgerDrawer from './CreditLedgerDrawer';
import { useToast } from '../common/Toast';

export default function CreditDebtView({
  credits = [],
  creditTransactions = [],
  currency = 'PKR'
}) {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'receivable' | 'payable' | 'committee' | 'installment'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'due_soon' | 'settled'
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
  const [creditToEdit, setCreditToEdit] = useState(null);
  const [selectedCreditForLedger, setSelectedCreditForLedger] = useState(null);

  // Overall Metrics & Peak Day
  const metrics = useMemo(() => {
    return calculateCreditMetrics(credits);
  }, [credits]);

  // Today and next week bounds for due alerts
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const nextWeekStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  }, []);

  // Filtered credits
  const filteredCredits = useMemo(() => {
    return credits.filter(c => {
      // Type/Category Tab
      if (activeTab === 'receivable' && c.type !== 'receivable') return false;
      if (activeTab === 'payable' && c.type !== 'payable') return false;
      if (activeTab === 'committee' && c.category !== 'committee') return false;
      if (activeTab === 'installment' && c.category !== 'installment') return false;

      // Status filter
      if (statusFilter === 'active' && c.status === 'settled') return false;
      if (statusFilter === 'settled' && c.status !== 'settled') return false;
      if (statusFilter === 'due_soon') {
        const isDue = c.dueDate && (c.dueDate < todayStr || (c.dueDate >= todayStr && c.dueDate <= nextWeekStr));
        if (!isDue || c.status === 'settled') return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = c.personName?.toLowerCase().includes(q);
        const matchPhone = c.phone?.toLowerCase().includes(q);
        const matchNotes = c.notes?.toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchNotes) return false;
      }

      return true;
    }).sort((a, b) => {
      // Prioritize active & due soon
      if (a.status === 'settled' && b.status !== 'settled') return 1;
      if (b.status === 'settled' && a.status !== 'settled') return -1;
      return (b.updatedAt || '') > (a.updatedAt || '') ? 1 : -1;
    });
  }, [credits, activeTab, statusFilter, searchQuery, todayStr, nextWeekStr]);

  // Active ledger transactions for drawer
  const activeLedgerTransactions = useMemo(() => {
    if (!selectedCreditForLedger) return [];
    return creditTransactions
      .filter(t => t.creditId === selectedCreditForLedger.id)
      .sort((a, b) => (b.date > a.date ? 1 : -1));
  }, [creditTransactions, selectedCreditForLedger]);

  const handleDelete = async (credit) => {
    if (confirm(`Delete account "${credit.personName}" and all associated ledger transactions?`)) {
      try {
        await deleteCredit(credit.id);
        showToast('Account removed successfully', 'success');
        if (selectedCreditForLedger?.id === credit.id) {
          setSelectedCreditForLedger(null);
        }
      } catch (err) {
        showToast('Error deleting: ' + err.message, 'error');
      }
    }
  };

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      {/* Top Header & New Account CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Credit &amp; Debt Engine
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Offline Ledger
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Receivables (Lena hai), Payables (Dena hai), Committees (Kameti), and Installments
          </p>
        </div>

        <button
          onClick={() => {
            setCreditToEdit(null);
            setIsCreditModalOpen(true);
          }}
          className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-500/25 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4 stroke-[3]" /> Add Credit / Debt / Committee
        </button>
      </div>

      {/* 4 Summary Cards: Net Balance, Receivables, Payables, Peak Day */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Net Balance */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Net Outstanding Balance</span>
            <div className={`p-2 rounded-xl ${metrics.netBalance >= 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'}`}>
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl sm:text-3xl font-black tracking-tight mb-1 ${
            metrics.netBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {formatCurrency(metrics.netBalance, currency)}
          </div>
          <p className="text-xs text-slate-400">
            {metrics.netBalance >= 0 ? 'Net positive (In your favor)' : 'Net liability (Payable higher)'}
          </p>
        </div>

        {/* Card 2: Total Receivable (Lena hai) */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Receivable (Lena hai)</span>
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight mb-1">
            {formatCurrency(metrics.totalReceivable, currency)}
          </div>
          <p className="text-xs text-slate-400">
            Money expected to come in
          </p>
        </div>

        {/* Card 3: Total Payable (Dena hai) */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Payable (Dena hai)</span>
            <div className="p-2 rounded-xl bg-rose-500/15 text-rose-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-400 tracking-tight mb-1">
            {formatCurrency(metrics.totalPayable, currency)}
          </div>
          <p className="text-xs text-slate-400">
            Committees, installments &amp; debts
          </p>
        </div>

        {/* Card 4: Highest Credit Peak Day */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Highest Credit Peak</span>
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-400 tracking-tight mb-1">
            {formatCurrency(metrics.overallPeakAmount, currency)}
          </div>
          <p className="text-xs text-slate-400 truncate">
            {metrics.overallPeakDate ? `Peak date: ${formatDate(metrics.overallPeakDate)}` : 'No peak data'}
          </p>
        </div>
      </div>

      {/* Due Alerts Banner if any */}
      {(metrics.overdueCount > 0 || metrics.dueThisWeekCount > 0) && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-white block">Upcoming Due &amp; Overdue Alerts:</span>
              <span className="text-slate-300">
                {metrics.overdueCount > 0 && (
                  <strong className="text-rose-400 mr-2">{metrics.overdueCount} accounts overdue ({formatCurrency(metrics.overdueAmount, currency)})</strong>
                )}
                {metrics.dueThisWeekCount > 0 && (
                  <strong className="text-amber-300">{metrics.dueThisWeekCount} accounts due this week ({formatCurrency(metrics.dueThisWeekAmount, currency)})</strong>
                )}
              </span>
            </div>
          </div>

          <button
            onClick={() => setStatusFilter('due_soon')}
            className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs transition-colors"
          >
            Show Due Soon
          </button>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-2xl">
          {[
            { id: 'all', label: 'All Accounts' },
            { id: 'receivable', label: 'Receivables (Lena hai)' },
            { id: 'payable', label: 'Payables (Dena hai)' },
            { id: 'committee', label: 'Committees (Kameti)' },
            { id: 'installment', label: 'Installments' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right Search & Status Filter */}
        <div className="flex items-center gap-2">
          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-200 outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Accounts</option>
            <option value="due_soon">Due This Week &amp; Overdue</option>
            <option value="settled">Settled / Closed</option>
          </select>

          {/* Search Box */}
          <div className="relative flex-1 sm:w-60">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search person or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Account Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCredits.map((c) => {
          const remaining = parseFloat(c.remainingAmount) || 0;
          const total = parseFloat(c.totalAmount) || 0;
          const isSettled = remaining === 0 || c.status === 'settled';
          const isOverdue = c.dueDate && c.dueDate < todayStr && !isSettled;
          const isDueThisWeek = c.dueDate && c.dueDate >= todayStr && c.dueDate <= nextWeekStr && !isSettled;
          const progressPercent = total > 0 ? Math.min(100, Math.round(((total - remaining) / total) * 100)) : 100;

          // Committee / Installment metrics
          const isScheduled = c.category === 'committee' || c.category === 'installment';
          const monthly = parseFloat(c.monthlyInstallment) || 0;
          const paidInstallments = monthly > 0 ? Math.round((total - remaining) / monthly) : 0;
          const totalTenure = parseInt(c.tenureMonths) || (monthly > 0 ? Math.ceil(total / monthly) : 0);

          return (
            <div
              key={c.id}
              className={`glass-card rounded-2xl p-5 border flex flex-col justify-between transition-all hover:border-slate-700 group ${
                isOverdue 
                  ? 'border-rose-500/40 bg-rose-950/10' 
                  : isDueThisWeek
                  ? 'border-amber-500/40 bg-amber-950/10'
                  : 'border-slate-800'
              }`}
            >
              <div>
                {/* Top Badges */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      c.type === 'receivable'
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                    }`}>
                      {c.type === 'receivable' ? 'Lena hai' : 'Dena hai'}
                    </span>
                    <span className="text-[10px] text-slate-400 capitalize bg-slate-800 px-2 py-0.5 rounded-full">
                      {c.category}
                    </span>
                  </div>

                  {/* Status Indicator */}
                  {isSettled ? (
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Settled
                    </span>
                  ) : isOverdue ? (
                    <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Overdue
                    </span>
                  ) : isDueThisWeek ? (
                    <span className="text-[10px] font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Due Soon
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  )}
                </div>

                {/* Person / Entity Name */}
                <h3 className="font-bold text-base text-white truncate">
                  {c.personName}
                </h3>
                {c.phone && <p className="text-xs text-slate-400 mt-0.5">{c.phone}</p>}

                {/* Balance & Original Amount */}
                <div className="my-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800/80">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Remaining Balance</span>
                      <span className={`text-xl font-black ${
                        isSettled 
                          ? 'text-emerald-400' 
                          : c.type === 'receivable' ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {formatCurrency(remaining, currency)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Original</span>
                      <span className="text-xs font-semibold text-slate-300">
                        {formatCurrency(total, currency)}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-2.5 space-y-1">
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          c.type === 'receivable' ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>{progressPercent}% cleared</span>
                      {isScheduled && totalTenure > 0 && (
                        <span>{paidInstallments} of {totalTenure} installments paid</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Schedule Details if committee/installment */}
                {isScheduled && (
                  <div className="mb-3 space-y-1 text-xs text-slate-300 bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/60">
                    {monthly > 0 && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Monthly Installment:</span>
                        <strong className="text-white">{formatCurrency(monthly, currency)}</strong>
                      </div>
                    )}
                    {c.category === 'committee' && c.payoutDate && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Committee Payout Date:</span>
                        <strong className="text-amber-300">{formatDate(c.payoutDate)}</strong>
                      </div>
                    )}
                    {c.dueDate && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Next Due Date:</span>
                        <strong className={isOverdue ? 'text-rose-400 font-bold' : isDueThisWeek ? 'text-amber-300 font-bold' : 'text-slate-200'}>
                          {formatDate(c.dueDate)}
                        </strong>
                      </div>
                    )}
                  </div>
                )}

                {/* Highest Credit Peak Indicator */}
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 pb-2">
                  <span>Peak: <strong className="text-slate-300">{formatCurrency(c.highestPeakAmount || total, currency)}</strong></span>
                  {c.highestPeakDate && (
                    <span>on {formatDate(c.highestPeakDate)}</span>
                  )}
                </div>

                {c.notes && (
                  <p className="text-[11px] text-slate-400 italic bg-slate-950/40 p-2 rounded-lg border border-slate-900 mb-3 truncate">
                    "{c.notes}"
                  </p>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedCreditForLedger(c)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-400 font-bold text-xs border border-emerald-500/30 transition-colors"
                >
                  <BookOpen className="w-3.5 h-3.5" /> Open Ledger
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setCreditToEdit(c);
                      setIsCreditModalOpen(true);
                    }}
                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title="Edit account"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(c)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                    title="Delete account"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredCredits.length === 0 && (
          <div className="col-span-full glass-card rounded-2xl p-12 text-center space-y-3">
            <HandCoins className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="font-bold text-base text-white">No credit or debt accounts found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Track money you will receive (Lena hai), debts you will pay (Dena hai), or active committees (Kameti) and installments.
            </p>
            <button
              onClick={() => {
                setCreditToEdit(null);
                setIsCreditModalOpen(true);
              }}
              className="mt-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl"
            >
              + Create First Account
            </button>
          </div>
        )}
      </div>

      {/* Credit / Debt Add/Edit Modal */}
      <CreditModal
        isOpen={isCreditModalOpen}
        onClose={() => {
          setIsCreditModalOpen(false);
          setCreditToEdit(null);
        }}
        creditToEdit={creditToEdit}
        currency={currency}
      />

      {/* Credit Ledger Drawer */}
      <CreditLedgerDrawer
        isOpen={Boolean(selectedCreditForLedger)}
        onClose={() => setSelectedCreditForLedger(null)}
        credit={selectedCreditForLedger}
        transactions={activeLedgerTransactions}
        currency={currency}
      />
    </div>
  );
}
