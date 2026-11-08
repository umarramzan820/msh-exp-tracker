import React from 'react';
import { 
  Plus, 
  Calendar, 
  Settings, 
  Database, 
  ShieldCheck, 
  RefreshCw, 
  Coins, 
  CalendarDays,
  Globe,
  Sparkles
} from 'lucide-react';
import { CURRENCIES } from '../../utils/formatters';
import { SYNC_STATUS } from '../../services/cloudSyncService';

export default function Navbar({
  activeTab,
  onNavigateTab,
  viewMode = 'single_month',
  setViewMode,
  selectedMonth,
  setSelectedMonth,
  availableMonths = [],
  currency = 'PKR',
  setCurrency,
  onOpenAddExpense,
  syncStatus = { status: SYNC_STATUS.IDLE }
}) {
  return (
    <header className="sticky top-0 z-30 glass-panel border-b border-slate-800/80 px-3 sm:px-6 lg:px-8 py-2.5 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Left: Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigateTab('home')}
            className="flex items-center gap-2.5 text-left group"
          >
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-emerald-600 flex items-center justify-center text-slate-950 font-black text-base shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              E
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-white group-hover:text-emerald-300 transition-colors">
                  Expensio
                </span>
                <span className="text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded-md">
                  Suite
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block -mt-0.5 hidden sm:inline">
                Unified Financial Suite
              </span>
            </div>
          </button>

          {/* Month Selector visible when on expenses/dashboard tabs */}
          {(activeTab === 'expenses' || activeTab === 'reports') && (
            <div className="hidden md:flex items-center gap-2 pl-3 border-l border-slate-800">
              <div className="flex items-center p-0.5 bg-slate-900 border border-slate-700/80 rounded-xl">
                <button
                  onClick={() => setViewMode('single_month')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    viewMode === 'single_month'
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Month
                </button>
                <button
                  onClick={() => setViewMode('consolidated')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    viewMode === 'consolidated'
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All Time
                </button>
              </div>

              {viewMode === 'single_month' && (
                <div className="flex items-center gap-1.5 bg-slate-900 border border-emerald-500/40 rounded-xl px-2.5 py-1">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="bg-transparent text-xs font-bold text-emerald-300 outline-none cursor-pointer"
                  >
                    {availableMonths.map((m) => (
                      <option key={m.key} value={m.key} className="bg-slate-900 text-slate-100 font-medium">
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Section: Quick Backup Status Badge, Currency & Settings */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Backup Status Badge */}
          <button
            onClick={() => onNavigateTab('settings')}
            title="Dexie IndexedDB Safe. Click to open Backup Center."
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/15 transition-all active:scale-95"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">DB Safe (Offline)</span>
            <span className="sm:hidden text-[10px]">Safe</span>
          </button>

          {/* Currency Switcher */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-700/80 rounded-xl px-2 py-1 shadow-inner">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-200 outline-none cursor-pointer"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code} className="bg-slate-900 text-slate-200">
                  {c.code} ({c.symbol})
                </option>
              ))}
            </select>
          </div>

          {/* Settings Button */}
          <button
            onClick={() => onNavigateTab('settings')}
            className={`p-2 rounded-xl border transition-all ${
              activeTab === 'settings'
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
            }`}
            title="Settings & Backup"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Quick Add Expense Button */}
          <button
            onClick={onOpenAddExpense}
            className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/25 active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span className="hidden sm:inline">Expense</span>
          </button>
        </div>
      </div>
    </header>
  );
}
