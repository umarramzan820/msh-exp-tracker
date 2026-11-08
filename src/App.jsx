import React, { useState, useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, initDatabase } from './db/db';
import { 
  getAvailableMonths, 
  getMonthDateRange, 
  filterExpensesByDateRange 
} from './utils/analytics';
import { cloudSyncService, SYNC_STATUS } from './services/cloudSyncService';

// Layout & Modular Components
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import MobileNav from './components/layout/MobileNav';

// Modular Views
import HomeHubView from './components/home/HomeHubView';
import CreditDebtView from './components/credit/CreditDebtView';
import ExpenseTrackerView from './components/expenses/ExpenseTrackerView';
import ReportsView from './components/reports/ReportsView';
import CategoriesManagerView from './components/categories/CategoriesManagerView';
import SettingsView from './components/settings/SettingsView';

// Modals & Common
import ExpenseModal from './components/expenses/ExpenseModal';
import CreditModal from './components/credit/CreditModal';
import PWAInstallPrompt from './components/common/PWAInstallPrompt';
import { ToastProvider, useToast } from './components/common/Toast';

function AppContent() {
  const { showToast } = useToast();

  // Navigation tab: 'home' | 'credit' | 'expenses' | 'reports' | 'categories' | 'settings'
  const [activeTab, setActiveTab] = useState('home');

  // Month-Wise Isolation & Filtering
  const [viewMode, setViewMode] = useState('single_month');
  const now = new Date();
  const defaultMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState(defaultMonthKey);

  // Currency (Default: PKR - Rs)
  const [currency, setCurrency] = useState('PKR');

  // Modal states
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState(null);

  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
  const [creditToEdit, setCreditToEdit] = useState(null);

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
    showToast(`Currency updated to ${newCurr}`, 'info', 2000);
  };

  // Reactive Dexie Live Queries
  const expenses = useLiveQuery(() => db.expenses.toArray(), []) || [];
  const categories = useLiveQuery(() => db.categories.toArray(), []) || [];
  const credits = useLiveQuery(() => db.credits.toArray(), []) || [];
  const creditTransactions = useLiveQuery(() => db.creditTransactions.toArray(), []) || [];

  // Available unique months
  const availableMonths = useMemo(() => {
    return getAvailableMonths(expenses);
  }, [expenses]);

  // Date range for active month scope
  const dateRange = useMemo(() => {
    if (viewMode === 'single_month') {
      return getMonthDateRange(selectedMonth);
    }
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

  // Active month label
  const activeMonthLabel = useMemo(() => {
    if (viewMode === 'consolidated') {
      return 'Consolidated (All Time)';
    }
    return availableMonths.find(m => m.key === selectedMonth)?.label || selectedMonth;
  }, [viewMode, selectedMonth, availableMonths]);

  // Expense Handlers
  const handleEditExpense = (expense) => {
    setExpenseToEdit(expense);
    setIsExpenseModalOpen(true);
  };

  const handleDeleteExpense = async (id) => {
    try {
      await db.expenses.delete(id);
      showToast('Expense removed', 'success');
    } catch (err) {
      showToast('Failed to delete: ' + err.message, 'error');
    }
  };

  return (
    <div className="flex h-full w-full bg-slate-950 text-slate-100 overflow-hidden">
      {/* Desktop Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        expenseCount={expenses.length}
        creditCount={credits.length}
        onOpenAddExpense={() => {
          setExpenseToEdit(null);
          setIsExpenseModalOpen(true);
        }}
        onOpenAddCredit={() => {
          setCreditToEdit(null);
          setIsCreditModalOpen(true);
        }}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Navbar */}
        <Navbar
          activeTab={activeTab}
          onNavigateTab={setActiveTab}
          viewMode={viewMode}
          setViewMode={setViewMode}
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          availableMonths={availableMonths}
          currency={currency}
          setCurrency={handleCurrencyChange}
          onOpenAddExpense={() => {
            setExpenseToEdit(null);
            setIsExpenseModalOpen(true);
          }}
          syncStatus={syncStatus}
        />

        {/* Scrollable View Container */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 pt-5 max-w-7xl mx-auto w-full">
          {activeTab === 'home' && (
            <HomeHubView
              expenses={expenses}
              categories={categories}
              credits={credits}
              currency={currency}
              selectedMonth={selectedMonth}
              activeMonthLabel={activeMonthLabel}
              onNavigateTab={setActiveTab}
              onOpenAddExpense={() => {
                setExpenseToEdit(null);
                setIsExpenseModalOpen(true);
              }}
              onOpenAddCredit={() => {
                setCreditToEdit(null);
                setIsCreditModalOpen(true);
              }}
            />
          )}

          {activeTab === 'credit' && (
            <CreditDebtView
              credits={credits}
              creditTransactions={creditTransactions}
              currency={currency}
            />
          )}

          {activeTab === 'expenses' && (
            <ExpenseTrackerView
              expenses={expenses}
              activeExpenses={activeExpenses}
              categories={categories}
              currency={currency}
              selectedMonth={selectedMonth}
              activeMonthLabel={activeMonthLabel}
              onOpenAddExpense={() => {
                setExpenseToEdit(null);
                setIsExpenseModalOpen(true);
              }}
              onOpenCategoryManager={() => setActiveTab('categories')}
              onEditExpense={handleEditExpense}
              onDeleteExpense={handleDeleteExpense}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              expenses={expenses}
              categories={categories}
              credits={credits}
              currency={currency}
              selectedMonth={selectedMonth}
              activeMonthLabel={activeMonthLabel}
            />
          )}

          {activeTab === 'categories' && (
            <CategoriesManagerView
              categories={categories}
              expenses={expenses}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              currency={currency}
              onCurrencyChange={handleCurrencyChange}
              expenses={expenses}
              credits={credits}
              categories={categories}
              onDataRestored={() => showToast('Data reloaded successfully', 'success')}
            />
          )}
        </main>
      </div>

      {/* Mobile Thumb Navigation */}
      <MobileNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddExpense={() => {
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

      {/* Add / Edit Credit Modal */}
      <CreditModal
        isOpen={isCreditModalOpen}
        onClose={() => {
          setIsCreditModalOpen(false);
          setCreditToEdit(null);
        }}
        creditToEdit={creditToEdit}
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
