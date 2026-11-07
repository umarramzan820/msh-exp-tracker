import React from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  PieChart, 
  FolderTree, 
  CloudUpload, 
  Plus 
} from 'lucide-react';

export default function MobileNav({ activeTab, setActiveTab, onOpenAddModal }) {
  const tabs = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    { id: 'add', isAction: true },
    { id: 'analytics', label: 'Analytics', icon: PieChart },
    { id: 'categories', label: 'Categories', icon: FolderTree }
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/80 px-2 pb-safe">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto">
        {tabs.map((tab) => {
          if (tab.isAction) {
            return (
              <button
                key="add-btn"
                onClick={onOpenAddModal}
                className="-mt-5 w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center shadow-xl shadow-emerald-500/30 active:scale-95 transition-transform"
                aria-label="Add Expense"
              >
                <Plus className="w-6 h-6 stroke-[3]" />
              </button>
            );
          }

          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors ${
                isActive ? 'text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className={`p-1 rounded-xl transition-all ${isActive ? 'bg-emerald-500/10' : ''}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] mt-0.5">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
