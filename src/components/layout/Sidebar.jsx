import React from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  PieChart, 
  FolderTree, 
  CloudUpload, 
  Database,
  Download,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { exportExpensesToCsv } from '../../services/backupService';
import { useToast } from '../common/Toast';

export default function Sidebar({ activeTab, setActiveTab, expenseCount = 0 }) {
  const { showToast } = useToast();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'expenses', label: 'Expenses', icon: Receipt, count: expenseCount },
    { id: 'analytics', label: 'Analytics & Trends', icon: PieChart },
    { id: 'categories', label: 'Category Hierarchy', icon: FolderTree },
    { id: 'backup', label: 'Backup & Cloud Sync', icon: CloudUpload }
  ];

  const handleQuickCsv = async () => {
    try {
      await exportExpensesToCsv();
      showToast('Expenses exported to CSV successfully', 'success');
    } catch {
      showToast('Failed to export CSV', 'error');
    }
  };

  return (
    <aside aria-label="Sidebar navigation" className="hidden md:flex flex-col w-64 lg:w-72 bg-slate-950 border-r border-slate-800/80 p-5 shrink-0 select-none">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-2 py-2 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-emerald-500/20">
          E
        </div>
        <div>
          <h1 className="font-extrabold text-lg tracking-tight text-white flex items-center gap-1.5">
            Expensio
            <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
              PWA
            </span>
          </h1>
          <p className="text-xs text-slate-400">Offline-first Tracker</p>
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
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
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
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                  isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                }`}>
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Storage & Offline Badge */}
      <div className="mt-auto space-y-3 pt-4 border-t border-slate-800/80">
        <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800/90 text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-emerald-400" /> Dexie DB
            </span>
            <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded">
              <ShieldCheck className="w-3 h-3" /> IndexedDB
            </span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            All data persists locally on your device with zero cloud dependency.
          </p>
        </div>

        {/* Quick CSV Export button */}
        <button
          onClick={handleQuickCsv}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/60 text-xs font-semibold text-slate-300 transition-colors"
        >
          <Download className="w-3.5 h-3.5" /> Quick CSV Export
        </button>
      </div>
    </aside>
  );
}
