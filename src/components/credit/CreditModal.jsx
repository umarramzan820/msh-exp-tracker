import React, { useState, useEffect } from 'react';
import { 
  X, 
  HandCoins, 
  Calendar, 
  Phone, 
  User, 
  FileText, 
  BadgePercent, 
  Layers,
  Sparkles,
  ArrowDownLeft,
  ArrowUpRight
} from 'lucide-react';
import { addCredit, updateCredit } from '../../db/db';
import { CURRENCIES } from '../../utils/formatters';
import { useToast } from '../common/Toast';

export default function CreditModal({
  isOpen,
  onClose,
  creditToEdit = null,
  currency = 'PKR',
  initialType = 'receivable'
}) {
  const { showToast } = useToast();

  const [type, setType] = useState('receivable'); // 'receivable' | 'payable'
  const [category, setCategory] = useState('personal'); // 'personal' | 'committee' | 'installment' | 'business'
  const [personName, setPersonName] = useState('');
  const [phone, setPhone] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [monthlyInstallment, setMonthlyInstallment] = useState('');
  const [tenureMonths, setTenureMonths] = useState('');
  const [payoutDate, setPayoutDate] = useState('');
  const [notes, setNotes] = useState('');

  const currentCurrency = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];

  useEffect(() => {
    if (creditToEdit) {
      setType(creditToEdit.type || 'receivable');
      setCategory(creditToEdit.category || 'personal');
      setPersonName(creditToEdit.personName || '');
      setPhone(creditToEdit.phone || '');
      setTotalAmount(String(creditToEdit.totalAmount || ''));
      setStartDate(creditToEdit.startDate || new Date().toISOString().split('T')[0]);
      setDueDate(creditToEdit.dueDate || '');
      setMonthlyInstallment(String(creditToEdit.monthlyInstallment || ''));
      setTenureMonths(String(creditToEdit.tenureMonths || ''));
      setPayoutDate(creditToEdit.payoutDate || '');
      setNotes(creditToEdit.notes || '');
    } else {
      setType(initialType);
      setCategory('personal');
      setPersonName('');
      setPhone('');
      setTotalAmount('');
      setStartDate(new Date().toISOString().split('T')[0]);
      // Default due date to 30 days ahead
      const nextMonth = new Date();
      nextMonth.setDate(nextMonth.getDate() + 30);
      setDueDate(nextMonth.toISOString().split('T')[0]);
      setMonthlyInstallment('');
      setTenureMonths('');
      setPayoutDate('');
      setNotes('');
    }
  }, [creditToEdit, initialType, isOpen]);

  // Auto-calculate tenure or installment if total and installment are filled
  const handleAmountChange = (val) => {
    setTotalAmount(val);
    const amt = parseFloat(val);
    const inst = parseFloat(monthlyInstallment);
    if (amt > 0 && inst > 0 && !tenureMonths) {
      setTenureMonths(String(Math.ceil(amt / inst)));
    }
  };

  const handleInstallmentChange = (val) => {
    setMonthlyInstallment(val);
    const amt = parseFloat(totalAmount);
    const inst = parseFloat(val);
    if (amt > 0 && inst > 0) {
      setTenureMonths(String(Math.ceil(amt / inst)));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const parsedTotal = parseFloat(totalAmount);
    if (isNaN(parsedTotal) || parsedTotal <= 0) {
      showToast('Please enter a valid amount greater than 0', 'error');
      return;
    }

    if (!personName.trim()) {
      showToast('Please enter person or organization name', 'error');
      return;
    }

    try {
      const payload = {
        type,
        category,
        personName: personName.trim(),
        phone: phone.trim(),
        totalAmount: parsedTotal,
        startDate,
        dueDate,
        monthlyInstallment: parseFloat(monthlyInstallment) || 0,
        tenureMonths: parseInt(tenureMonths) || 0,
        payoutDate: category === 'committee' ? payoutDate : '',
        notes: notes.trim()
      };

      if (creditToEdit) {
        await updateCredit(creditToEdit.id, payload);
        showToast(`Account "${personName}" updated successfully`, 'success');
      } else {
        await addCredit(payload);
        showToast(
          `Record "${personName}" added as ${type === 'receivable' ? 'Receivable (Lena hai)' : 'Payable (Dena hai)'}`,
          'success'
        );
      }
      onClose();
    } catch (err) {
      showToast('Error saving: ' + err.message, 'error');
    }
  };

  if (!isOpen) return null;

  const isScheduleType = category === 'committee' || category === 'installment';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-lg glass-modal rounded-3xl shadow-2xl border border-slate-700/80 p-5 sm:p-6 overflow-hidden max-h-[92vh] flex flex-col z-10 animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
              type === 'receivable' 
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
            }`}>
              <HandCoins className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">
                {creditToEdit ? 'Edit Account' : 'New Credit / Debt / Committee'}
              </h3>
              <p className="text-xs text-slate-400">Ledger &amp; Installment Scheduler</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {/* Direction Toggle: I will receive vs I will pay */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Direction (Lena / Dena)
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900 border border-slate-800 rounded-2xl">
              <button
                type="button"
                onClick={() => setType('receivable')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                  type === 'receivable'
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ArrowDownLeft className="w-4 h-4" />
                <span>I Will Receive (Lena hai)</span>
              </button>

              <button
                type="button"
                onClick={() => setType('payable')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                  type === 'payable'
                    ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>I Will Pay (Dena hai)</span>
              </button>
            </div>
          </div>

          {/* Category Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'personal', label: 'Personal Loan' },
                { id: 'committee', label: 'Committee (Kameti)' },
                { id: 'installment', label: 'Installment' },
                { id: 'business', label: 'Business / Udhar' }
              ].map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`p-2.5 rounded-xl text-xs font-medium border text-center transition-all ${
                    category === cat.id
                      ? 'bg-slate-800 border-emerald-500/50 text-white font-bold'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Person / Entity Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                {category === 'committee' ? 'Committee Name / Holder' : 'Person / Organization'}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder={category === 'committee' ? 'e.g. Al-Falah Committee' : 'e.g. Tariq Mehmood'}
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Phone Number (Optional)
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="tel"
                  placeholder="0300-1234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Total Amount Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Total Amount ({currentCurrency.code})
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-xl font-bold text-emerald-400">
                {currentCurrency.symbol}
              </span>
              <input
                type="number"
                step="any"
                min="0"
                required
                placeholder="0"
                value={totalAmount}
                onChange={(e) => handleAmountChange(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-700/80 rounded-2xl text-2xl font-black text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Committee / Installment Scheduler Fields */}
          {isScheduleType && (
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 animate-scale-up">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                <BadgePercent className="w-4 h-4" />
                <span>Installment &amp; Tenure Scheduler</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Monthly Installment ({currentCurrency.code})
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 10000"
                    value={monthlyInstallment}
                    onChange={(e) => handleInstallmentChange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-600 outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Tenure (Months)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 10"
                    value={tenureMonths}
                    onChange={(e) => setTenureMonths(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-600 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {category === 'committee' && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Committee Payout Date (When you draw the pot)
                  </label>
                  <input
                    type="date"
                    value={payoutDate}
                    onChange={(e) => setPayoutDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-emerald-500"
                  />
                </div>
              )}
            </div>
          )}

          {/* Dates: Start Date & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Start Date
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                {isScheduleType ? 'Next Due Date / Final Due' : 'Due Date'}
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Notes &amp; Agreement Details
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Committee starts in May. Total members: 10. Handover date..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-6 py-2.5 rounded-xl text-slate-950 text-sm font-bold shadow-lg active:scale-95 transition-all ${
                type === 'receivable'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-emerald-500/25'
                  : 'bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-rose-500/25'
              }`}
            >
              {creditToEdit ? 'Save Changes' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
