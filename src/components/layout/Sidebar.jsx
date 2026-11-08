import React from 'react';
import { 
  Home, 
  Receipt, 
  HandCoins, 
  BarChart3, 
  FolderTree, 
  Settings, 
  Database,
  Mail,
  ShieldCheck,
  Plus
} from 'lucide-react';
import { useToast } from '../common/Toast';

export default function Sidebar({
  activeTab,
  setActiveTab,
  expenseCount = 0,
  creditCount = 0,
  onOpenAddExpense,
  onOpenAddCredit
}) {
  const navItems = [
    { id: 'home', label: 'Executive Hub', icon: Home },
    { id: 'credit', label: 'Credit & Debt Manager', icon: HandCoins, count: creditCount, badgeColor: 'bg-amber-500/20 text-amber-300' },
    { id: 'expenses', label: 'Expense Tracker', icon: Receipt, count: expenseCount, badgeColor: 'bg-emerald-500/20 text-emerald-300' },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
    { id: 'categories', label: 'Category Hierarchy', icon: FolderTree },
    { id: 'settings', label: 'Settings & Backup', icon: Settings }
  ];

  return (
    <aside aria-label="Sidebar navigation" className="hidden md:flex flex-col w-64 lg:w-72 bg-slate-950 border-r border-slate-800/80 p-5 shrink-0 select-none">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-2 py-2 mb-6 cursor-pointer" onClick={() => setActiveTab('home')}>
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-emerald-600 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-emerald-500/20">
          E
        </div>
        <div>
          <h1 className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
            Expensio
            <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30">
              Suite
            </span>
          </h1>
          <p className="text-[11px] text-slate-400">Unified Financial Suite</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav aria-label="Main navigation" className="flex-1 space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-500/15 to-teal-500/10 text-emerald-300 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.count !== undefined && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  isActive ? 'bg-emerald-500/20 text-emerald-300' : item.badgeColor || 'bg-slate-800 text-slate-400'
                }`}>
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Quick Actions & DB Safe Card */}
      <div className="mt-auto space-y-3 pt-4 border-t border-slate-800/80">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onOpenAddExpense}
            className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold text-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Expense
          </button>
          <button
            onClick={onOpenAddCredit}
            className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 font-bold text-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Credit/Debt
          </button>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800/90 text-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-slate-300 font-semibold flex items-center gap-1.5 text-xs">
              <Database className="w-3.5 h-3.5 text-emerald-400" /> Dexie IndexedDB
            </span>
            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">
              Active
            </span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Pure offline local storage with zero cloud latency.
          </p>
        </div>
      </div>
    </aside>
  );
}
