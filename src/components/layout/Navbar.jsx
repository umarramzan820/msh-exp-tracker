import React from 'react';
import { 
  Plus, 
  Calendar, 
  WifiOff, 
  RefreshCw, 
  Coins, 
  Layers,
  CalendarDays,
  Globe
} from 'lucide-react';
import { CURRENCIES } from '../../utils/formatters';
import { SYNC_STATUS } from '../../services/cloudSyncService';

export default function Navbar({
  viewMode = 'single_month', // 'single_month' | 'consolidated'
  setViewMode,
  selectedMonth,
  setSelectedMonth,
  availableMonths = [],
  currency,
  setCurrency,
  onOpenAddModal,
  syncStatus,
  onTriggerSync
}) {
  return (
    <header className="sticky top-0 z-30 glass-panel border-b border-slate-800/80 px-3 sm:px-6 lg:px-8 py-2.5 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        
        {/* Left Section: Brand & Month Isolation Switcher */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Mobile Brand */}
          <div className="flex md:hidden items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-slate-950 font-black text-sm shadow-md shadow-emerald-500/20">
              E
            </div>
            <span className="font-extrabold text-sm tracking-tight text-white">
              Expensio
            </span>
          </div>

          {/* Toggle Switch: Single Month View vs Consolidated View */}
          <div className="flex items-center p-0.5 bg-slate-900 border border-slate-700/80 rounded-xl shadow-inner">
            <button
              onClick={() => setViewMode('single_month')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'single_month'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Single Month</span>
            </button>

            <button
              onClick={() => setViewMode('consolidated')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'consolidated'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Consolidated (All Time)</span>
            </button>
          </div>

          {/* Dedicated Month Picker Dropdown (Visible in Single Month View) */}
          {viewMode === 'single_month' ? (
            <div className="flex items-center gap-1.5 bg-slate-900/90 border border-emerald-500/40 rounded-xl px-2.5 py-1 shadow-inner animate-scale-up">
              <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-xs font-bold text-emerald-300 outline-none cursor-pointer pr-1"
                aria-label="Select Active Month"
              >
                {availableMonths.map((m) => (
                  <option key={m.key} value={m.key} className="bg-slate-900 text-slate-100 font-medium">
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-1.5 bg-slate-900/60 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-slate-400">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span>All Historical Records Aggregated</span>
            </div>
          )}
        </div>

        {/* Right Section: Sync Pill, Currency & Quick Add */}
        <div className="flex items-center justify-between md:justify-end gap-2 sm:gap-3">
          {/* Offline / Online Sync Status Pill */}
          <button
            onClick={onTriggerSync}
            title={
              syncStatus.status === SYNC_STATUS.OFFLINE
                ? 'Offline Mode Active (Dexie IndexedDB)'
                : syncStatus.status === SYNC_STATUS.SYNCING
                ? 'Syncing with cloud...'
                : 'Click to sync now'
            }
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all active:scale-95 ${
              syncStatus.status === SYNC_STATUS.OFFLINE
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                : syncStatus.status === SYNC_STATUS.SYNCING
                ? 'bg-sky-500/10 border-sky-500/30 text-sky-300'
                : syncStatus.status === SYNC_STATUS.ERROR
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            }`}
          >
            {syncStatus.status === SYNC_STATUS.OFFLINE ? (
              <>
                <WifiOff className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Offline</span>
              </>
            ) : syncStatus.status === SYNC_STATUS.SYNCING ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span className="hidden sm:inline">Syncing...</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 relative">
                  <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
                </span>
                <span className="hidden sm:inline">Synced</span>
              </>
            )}
          </button>

          {/* Currency Switcher */}
          <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-700/70 rounded-xl px-2 py-1 shadow-inner">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-200 outline-none cursor-pointer"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code} className="bg-slate-900 text-slate-200">
                  {c.code} ({c.symbol})
                </option>
              ))}
            </select>
          </div>

          {/* Add Expense Button */}
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/25 transition-all transform active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>
    </header>
  );
}
