import React, { useState, useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, initDatabase } from './db/db';
import { 
  getAvailableMonths, 
  getMonthDateRange, 
  filterExpensesByDateRange 
} from './utils/analytics';
import { cloudSyncService, SYNC_STATUS } from './services/cloudSyncService';

// Layout & Components
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import MobileNav from './components/layout/MobileNav';
import DashboardView from './components/dashboard/DashboardView';
import ExpensesListView from './components/expenses/ExpensesListView';
import AnalyticsView from './components/analytics/AnalyticsView';
import CategoriesManagerView from './components/categories/CategoriesManagerView';
import BackupSyncView from './components/backup/BackupSyncView';
import ExpenseModal from './components/expenses/ExpenseModal';
import PWAInstallPrompt from './components/common/PWAInstallPrompt';
import { ToastProvider, useToast } from './components/common/Toast';

function AppContent() {
  const { showToast } = useToast();

  // Navigation tab
  const [activeTab, setActiveTab] = useState('dashboard');

  // Month-Wise Isolation & Filtering: 'single_month' vs 'consolidated'
  const [viewMode, setViewMode] = useState('single_month');
  
  // Selected Month (YYYY-MM), defaulting to current month
  const now = new Date();
  const defaultMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState(defaultMonthKey);

  // Currency
  const [currency, setCurrency] = useState('USD');

  // Modal states
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState(null);

  // Cloud Sync state
  const [syncStatus, setSyncStatus] = useState({ status: SYNC_STATUS.IDLE });

  // Initialize DB seeds on first boot
  useEffect(() => {
    async function init() {
      await initDatabase();
      const curr = await db.settings.get('currency');
      if (curr?.value) {
        setCurrency(curr.value);
      }
    }
    init();

    const unsub = cloudSyncService.subscribe((statusObj) => {
      setSyncStatus(statusObj);
    });
    return unsub;
  }, []);

  // Save currency change to DB
  const handleCurrencyChange = async (newCurr) => {
    setCurrency(newCurr);
    await db.settings.put({ key: 'currency', value: newCurr });
    showToast(`Currency switched to ${newCurr}`, 'info', 2000);
  };

  // Live queries from Dexie IndexedDB
  const expenses = useLiveQuery(() => db.expenses.toArray(), []) || [];
  const categories = useLiveQuery(() => db.categories.toArray(), []) || [];

  // Available unique months dynamically extracted from expenses
  const availableMonths = useMemo(() => {
    return getAvailableMonths(expenses);
  }, [expenses]);

  // Date range for the active scope
  const dateRange = useMemo(() => {
    if (viewMode === 'single_month') {
      return getMonthDateRange(selectedMonth);
    }
    // Consolidated all-time
    return {
      startDateStr: '2000-01-01',
      endDateStr: '2099-12-31',
      startDate: new Date(2000, 0, 1),
      endDate: new Date(2099, 11, 31)
    };
  }, [viewMode, selectedMonth]);

  // Strictly active expenses according to viewMode
  const activeExpenses = useMemo(() => {
    if (viewMode === 'consolidated') {
      return expenses;
    }
    return filterExpensesByDateRange(expenses, dateRange.startDateStr, dateRange.endDateStr);
  }, [expenses, viewMode, dateRange]);

  // Active month label for titles and badges
  const activeMonthLabel = useMemo(() => {
    if (viewMode === 'consolidated') {
      return 'Consolidated (All Time)';
    }
    return availableMonths.find(m => m.key === selectedMonth)?.label || selectedMonth;
  }, [viewMode, selectedMonth, availableMonths]);

  // Handle Edit Expense
  const handleEditExpense = (expense) => {
    setExpenseToEdit(expense);
    setIsExpenseModalOpen(true);
  };

  // Handle Delete Expense
  const handleDeleteExpense = async (id) => {
    try {
      await db.expenses.delete(id);
      showToast('Expense removed', 'success');
    } catch (err) {
      showToast('Failed to delete: ' + err.message, 'error');
    }
  };

  // Trigger manual cloud sync
  const handleTriggerSync = async () => {
    try {
      const res = await cloudSyncService.syncNow();
      if (res.success) {
        showToast('Cloud sync complete!', 'success');
      } else if (res.reason === 'not_configured') {
        setActiveTab('backup');
        showToast('Please configure Cloud Sync credentials first', 'info');
      } else if (res.reason === 'offline') {
        showToast('Device is offline. Local Dexie database active.', 'info');
      }
    } catch (err) {
      showToast('Sync error: ' + err.message, 'error');
    }
  };

  return (
    <div className="flex h-full w-full bg-slate-950 text-slate-100 overflow-hidden">
      {/* Desktop Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        expenseCount={activeExpenses.length}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Navbar with Month Picker and View Mode Toggle */}
        <Navbar
          viewMode={viewMode}
          setViewMode={setViewMode}
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          availableMonths={availableMonths}
          currency={currency}
          setCurrency={handleCurrencyChange}
          onOpenAddModal={() => {
            setExpenseToEdit(null);
            setIsExpenseModalOpen(true);
          }}
          syncStatus={syncStatus}
          onTriggerSync={handleTriggerSync}
        />

        {/* Scrollable View Container */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 pt-5 max-w-7xl mx-auto w-full">
          {activeTab === 'dashboard' && (
            <DashboardView
              expenses={expenses}
              activeExpenses={activeExpenses}
              categories={categories}
              viewMode={viewMode}
              selectedMonth={selectedMonth}
              activeMonthLabel={activeMonthLabel}
              dateRange={dateRange}
              currency={currency}
              onOpenAddModal={() => {
                setExpenseToEdit(null);
                setIsExpenseModalOpen(true);
              }}
              onViewAllExpenses={() => setActiveTab('expenses')}
              onNavigateToAnalytics={() => setActiveTab('analytics')}
            />
          )}

          {activeTab === 'expenses' && (
            <ExpensesListView
              expenses={activeExpenses}
              categories={categories}
              currency={currency}
              onOpenAddModal={() => {
                setExpenseToEdit(null);
                setIsExpenseModalOpen(true);
              }}
              onEditExpense={handleEditExpense}
              onDeleteExpense={handleDeleteExpense}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsView
              expenses={expenses}
              activeExpenses={activeExpenses}
              categories={categories}
              currency={currency}
              viewMode={viewMode}
              selectedMonth={selectedMonth}
              activeMonthLabel={activeMonthLabel}
              dateRange={dateRange}
            />
          )}

          {activeTab === 'categories' && (
            <CategoriesManagerView
              categories={categories}
              expenses={expenses}
            />
          )}

          {activeTab === 'backup' && (
            <BackupSyncView
              expenses={expenses}
              categories={categories}
            />
          )}
        </main>
      </div>

      {/* Mobile Thumb Navigation */}
      <MobileNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddModal={() => {
          setExpenseToEdit(null);
          setIsExpenseModalOpen(true);
        }}
      />

      {/* Add / Edit Expense Modal */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => {
          setIsExpenseModalOpen(false);
          setExpenseToEdit(null);
        }}
        expenseToEdit={expenseToEdit}
        currency={currency}
      />

      {/* PWA Home Screen Installation Prompt */}
      <PWAInstallPrompt />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
