import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Trash2, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  FileText,
  BadgePercent,
  CheckCircle2
} from 'lucide-react';
import { addCreditTransaction, deleteCreditTransaction } from '../../db/db';
import { formatCurrency, formatDate, formatRelativeDate } from '../../utils/formatters';
import { useToast } from '../common/Toast';

export default function CreditLedgerDrawer({
  isOpen,
  onClose,
  credit,
  transactions = [],
  currency = 'PKR'
}) {
  const { showToast } = useToast();

  const [txType, setTxType] = useState('payment'); // 'payment' | 'additional_credit'
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !credit) return null;

  const remaining = parseFloat(credit.remainingAmount) || 0;
  const total = parseFloat(credit.totalAmount) || 0;
  const progressPercent = total > 0 ? Math.min(100, Math.round(((total - remaining) / total) * 100)) : 100;

  const handleAddTx = async (e) => {
    e.preventDefault();
    const parsedAmt = parseFloat(amount);
    if (isNaN(parsedAmt) || parsedAmt <= 0) {
      showToast('Please enter a valid amount', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await addCreditTransaction({
        creditId: credit.id,
        amount: parsedAmt,
        type: txType,
        date,
        notes
      });

      showToast(
        txType === 'payment'
          ? `Recorded payment of ${formatCurrency(parsedAmt, currency)}`
          : `Added credit of ${formatCurrency(parsedAmt, currency)}`,
        'success'
      );
      setAmount('');
      setNotes('');
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTx = async (txId) => {
    if (confirm('Delete this ledger entry? Balance will be readjusted.')) {
      try {
        await deleteCreditTransaction(txId);
        showToast('Ledger entry removed', 'info');
      } catch (err) {
        showToast('Error deleting entry: ' + err.message, 'error');
      }
    }
  };

  // Quick fill suggested installment if available
  const handleQuickInstallment = () => {
    if (credit.monthlyInstallment > 0) {
      setAmount(String(credit.monthlyInstallment));
      setTxType('payment');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-xl glass-modal rounded-3xl shadow-2xl border border-slate-700/80 p-5 sm:p-6 overflow-hidden max-h-[92vh] flex flex-col z-10 animate-scale-up">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                credit.type === 'receivable'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
              }`}>
                {credit.type === 'receivable' ? 'Lena hai (Receivable)' : 'Dena hai (Payable)'}
              </span>
              <span className="text-xs text-slate-400 capitalize bg-slate-800 px-2 py-0.5 rounded-full">
                {credit.category}
              </span>
              {credit.status === 'settled' && (
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Settled
                </span>
              )}
            </div>
            <h3 className="font-extrabold text-xl text-white tracking-tight">
              {credit.personName}
            </h3>
            {credit.phone && (
              <p className="text-xs text-slate-400 mt-0.5">{credit.phone}</p>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Ledger Summary Cards */}
        <div className="py-4 grid grid-cols-2 sm:grid-cols-3 gap-3 border-b border-slate-800">
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Remaining Balance
            </span>
            <span className={`text-lg sm:text-xl font-black ${
              remaining === 0 
                ? 'text-emerald-400' 
                : credit.type === 'receivable' ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {formatCurrency(remaining, currency)}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Original Principal
            </span>
            <span className="text-lg sm:text-xl font-bold text-white">
              {formatCurrency(total, currency)}
            </span>
          </div>

          <div className="col-span-2 sm:col-span-1 p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Highest Credit Peak
            </span>
            <span className="text-sm font-bold text-amber-400 block">
              {formatCurrency(credit.highestPeakAmount || total, currency)}
            </span>
            <span className="text-[10px] text-slate-400">
              on {formatDate(credit.highestPeakDate || credit.startDate)}
            </span>
          </div>
        </div>

        {/* Committee / Installment Progress Bar */}
        {(credit.category === 'committee' || credit.category === 'installment') && (
          <div className="py-3 border-b border-slate-800">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                <BadgePercent className="w-3.5 h-3.5 text-emerald-400" />
                Installment Completion ({progressPercent}%)
              </span>
              <span className="text-slate-400 text-[11px]">
                {credit.monthlyInstallment ? `${formatCurrency(credit.monthlyInstallment, currency)} / month` : ''}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Scrollable Body: Log New Entry + History */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {/* Quick Transaction Entry Form */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-emerald-400" /> Log New Transaction
              </span>
              {credit.monthlyInstallment > 0 && (
                <button
                  type="button"
                  onClick={handleQuickInstallment}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold"
                >
                  Quick Fill Installment ({formatCurrency(credit.monthlyInstallment, currency)})
                </button>
              )}
            </div>

            <form onSubmit={handleAddTx} className="space-y-3">
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setTxType('payment')}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                    txType === 'payment'
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Payment Received / Made (-)
                </button>
                <button
                  type="button"
                  onClick={() => setTxType('additional_credit')}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                    txType === 'additional_credit'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Additional Credit / Borrow (+)
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    placeholder="Amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Notes (e.g. Paid via Cash, Installment #4, Bank receipt...)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-500/20 active:scale-95"
              >
                {isSubmitting ? 'Recording Entry...' : 'Record In Ledger'}
              </button>
            </form>
          </div>

          {/* Timestamped Transaction History */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              Ledger History ({transactions.length} entries)
            </h4>

            <div className="divide-y divide-slate-800/80 rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden">
              {transactions.map((tx) => (
                <div key={tx.id} className="p-3 flex items-center justify-between gap-3 group hover:bg-slate-850 transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`p-2 rounded-xl shrink-0 ${
                      tx.type === 'payment'
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : 'bg-amber-500/15 text-amber-400'
                    }`}>
                      {tx.type === 'payment' ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">
                        {tx.type === 'payment' ? 'Payment Logged' : 'Additional Credit'}
                        {tx.notes ? ` - ${tx.notes}` : ''}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {formatDate(tx.date)} ({formatRelativeDate(tx.date)})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs font-black ${
                      tx.type === 'payment' ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      {tx.type === 'payment' ? '-' : '+'}
                      {formatCurrency(tx.amount, currency)}
                    </span>
                    <button
                      onClick={() => handleDeleteTx(tx.id)}
                      className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                      title="Delete entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {transactions.length === 0 && (
                <div className="p-8 text-center text-xs text-slate-500">
                  No payment or credit transactions recorded in this ledger yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
