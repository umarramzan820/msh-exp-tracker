import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Edit3, 
  Trash2, 
  Calendar, 
  X, 
  Plus,
  CheckSquare,
  Square,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { db } from '../../db/db';
import { formatCurrency, formatRelativeDate, formatDate, getPaymentMethodInfo, PAYMENT_METHODS } from '../../utils/formatters';
import IconRenderer from '../common/IconRenderer';
import { exportExpensesToCsv } from '../../services/backupService';
import { useToast } from '../common/Toast';

export default function ExpensesListView({
  expenses,
  categories,
  currency,
  onOpenAddModal,
  onEditExpense,
  onDeleteExpense
}) {
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('all');
  const [selectedTag, setSelectedTag] = useState('all');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [groupByDate, setGroupByDate] = useState(true);

  // Multi-Select & Bulk Operations State
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const categoryMap = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories]);

  // Extract all unique tags
  const allTags = useMemo(() => {
    const set = new Set();
    expenses.forEach(e => {
      if (Array.isArray(e.tags)) {
        e.tags.forEach(t => set.add(t));
      }
    });
    return Array.from(set).sort();
  }, [expenses]);

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      // Search text
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const cat = categoryMap.get(exp.subcategoryId) || categoryMap.get(exp.categoryId);
        const matchDesc = exp.description?.toLowerCase().includes(q);
        const matchNotes = exp.notes?.toLowerCase().includes(q);
        const matchCat = cat?.name?.toLowerCase().includes(q);
        const matchTags = Array.isArray(exp.tags) && exp.tags.some(t => t.toLowerCase().includes(q));
        if (!matchDesc && !matchNotes && !matchCat && !matchTags) return false;
      }

      // Category filter
      if (selectedCategory !== 'all') {
        const catId = exp.categoryId;
        const subId = exp.subcategoryId;
        if (catId !== selectedCategory && subId !== selectedCategory) {
          const subCat = categoryMap.get(subId);
          if (subCat?.parentId !== selectedCategory) {
            return false;
          }
        }
      }

      // Payment method filter
      if (selectedPaymentMethod !== 'all' && exp.paymentMethod !== selectedPaymentMethod) {
        return false;
      }

      // Tag filter
      if (selectedTag !== 'all') {
        if (!Array.isArray(exp.tags) || !exp.tags.includes(selectedTag)) {
          return false;
        }
      }

      // Amount filter
      const amt = parseFloat(exp.amount) || 0;
      if (minAmount !== '' && amt < parseFloat(minAmount)) return false;
      if (maxAmount !== '' && amt > parseFloat(maxAmount)) return false;

      return true;
    }).sort((a, b) => (b.date > a.date ? 1 : -1));
  }, [expenses, searchQuery, selectedCategory, selectedPaymentMethod, selectedTag, minAmount, maxAmount, categoryMap]);

  // Total amount of filtered
  const filteredTotal = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  }, [filteredExpenses]);

  // Amount of selected items
  const selectedTotal = useMemo(() => {
    return expenses
      .filter(e => selectedIds.has(e.id))
      .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  }, [expenses, selectedIds]);

  // Grouped by Date
  const groupedExpenses = useMemo(() => {
    if (!groupByDate) return { 'All Transactions': filteredExpenses };

    const groups = {};
    filteredExpenses.forEach(exp => {
      const dateKey = exp.date;
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(exp);
    });
    return groups;
  }, [filteredExpenses, groupByDate]);

  // Selection handlers
  const handleToggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const isAllSelected = useMemo(() => {
    if (filteredExpenses.length === 0) return false;
    return filteredExpenses.every(e => selectedIds.has(e.id));
  }, [filteredExpenses, selectedIds]);

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      // Unselect all currently filtered
      setSelectedIds(prev => {
        const next = new Set(prev);
        filteredExpenses.forEach(e => next.delete(e.id));
        return next;
      });
    } else {
      // Select all currently filtered
      setSelectedIds(prev => {
        const next = new Set(prev);
        filteredExpenses.forEach(e => next.add(e.id));
        return next;
      });
    }
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  // Safe Batch Delete via IndexedDB bulkDelete
  const handleExecuteBulkDelete = async () => {
    const idsToDelete = Array.from(selectedIds);
    if (idsToDelete.length === 0) return;

    setIsDeleting(true);
    try {
      await db.expenses.bulkDelete(idsToDelete);
      showToast(`Successfully deleted ${idsToDelete.length} expenses`, 'success');
      setSelectedIds(new Set());
      setShowBulkDeleteModal(false);
    } catch (err) {
      showToast(`Failed to delete entries: ${err.message}`, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const hasActiveFilters = selectedCategory !== 'all' || selectedPaymentMethod !== 'all' || selectedTag !== 'all' || minAmount !== '' || maxAmount !== '';

  const clearFilters = () => {
    setSelectedCategory('all');
    setSelectedPaymentMethod('all');
    setSelectedTag('all');
    setMinAmount('');
    setMaxAmount('');
    setSearchQuery('');
  };

  const handleExportFiltered = async () => {
    try {
      await exportExpensesToCsv();
      showToast('Exported filtered expenses to CSV', 'success');
    } catch {
      showToast('Export failed', 'error');
    }
  };

  return (
    <div className="space-y-5 pb-32 md:pb-16 relative">
      {/* Top Header & Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Expense Records
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
              {filteredExpenses.length} found
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Total for filtered view: <strong className="text-emerald-400">{formatCurrency(filteredTotal, currency)}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setGroupByDate(!groupByDate)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
              groupByDate ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            {groupByDate ? 'Grouped by Date' : 'Flat List'}
          </button>

          <button
            onClick={handleExportFiltered}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-300 transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> CSV
          </button>

          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/25 transition-all"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" /> Add
          </button>
        </div>
      </div>

      {/* Search Input, Select All Checkbox & Filter Button */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title, description, #tag, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-3 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Select All Checkbox Button */}
          <button
            onClick={handleToggleSelectAll}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl border text-xs font-semibold transition-all ${
              isAllSelected
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                : selectedIds.size > 0
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                : 'bg-slate-900/90 border-slate-700/80 text-slate-300 hover:border-slate-600'
            }`}
            title={isAllSelected ? 'Deselect all visible entries' : 'Select all visible entries'}
          >
            {isAllSelected ? (
              <CheckSquare className="w-4 h-4 text-emerald-400" />
            ) : selectedIds.size > 0 ? (
              <CheckSquare className="w-4 h-4 text-emerald-400/70" />
            ) : (
              <Square className="w-4 h-4 text-slate-400" />
            )}
            <span>Select All ({filteredExpenses.length})</span>
          </button>

          {/* Filter Toggle Button */}
          <button
            onClick={() => setShowFilterDrawer(!showFilterDrawer)}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl border text-xs font-semibold transition-all ${
              hasActiveFilters || showFilterDrawer
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                : 'bg-slate-900/90 border-slate-700/80 text-slate-300 hover:border-slate-600'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            )}
          </button>
        </div>
      </div>

      {/* Collapsible Filter Panel */}
      {showFilterDrawer && (
        <div className="glass-card rounded-2xl p-4 space-y-3.5 border border-slate-700/80 animate-scale-up">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Dynamic Filters</span>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-rose-400 hover:text-rose-300 font-semibold"
              >
                Clear all filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 outline-none focus:border-emerald-500"
              >
                <option value="all">All Categories</option>
                {categories.filter(c => !c.parentId).map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Payment Method</label>
              <select
                value={selectedPaymentMethod}
                onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 outline-none focus:border-emerald-500"
              >
                <option value="all">All Payment Methods</option>
                {PAYMENT_METHODS.map(m => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Tag Filter</label>
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 outline-none focus:border-emerald-500"
              >
                <option value="all">All Tags</option>
                {allTags.map(t => (
                  <option key={t} value={t}>#{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Amount Range</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  placeholder="Min"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                  className="w-1/2 px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 outline-none"
                />
                <span className="text-slate-600">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                  className="w-1/2 px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expenses List: Grouped or Flat */}
      <div className="space-y-5">
        {Object.entries(groupedExpenses).map(([dateKey, items]) => {
          const groupTotal = items.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

          return (
            <div key={dateKey} className="glass-card rounded-2xl overflow-hidden border border-slate-800/80">
              {/* Group Date Header */}
              {groupByDate && (
                <div className="bg-slate-900/90 px-4 py-2.5 flex items-center justify-between border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-xs font-bold text-slate-200">
                      {formatRelativeDate(dateKey)} ({formatDate(dateKey)})
                    </span>
                    <span className="text-[11px] text-slate-500">
                      • {items.length} {items.length === 1 ? 'item' : 'items'}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-emerald-400">
                    {formatCurrency(groupTotal, currency)}
                  </span>
                </div>
              )}

              {/* Transactions in this group */}
              <div className="divide-y divide-slate-800/60">
                {items.map((exp) => {
                  const cat = categoryMap.get(exp.subcategoryId) || categoryMap.get(exp.categoryId);
                  const parentCat = cat?.parentId ? categoryMap.get(cat.parentId) : cat;
                  const pm = getPaymentMethodInfo(exp.paymentMethod);
                  const isSelected = selectedIds.has(exp.id);

                  return (
                    <div
                      key={exp.id}
                      className={`p-3.5 sm:p-4 flex items-center justify-between gap-3 transition-colors group ${
                        isSelected
                          ? 'bg-emerald-500/10 border-l-4 border-l-emerald-400'
                          : 'hover:bg-slate-800/30'
                      }`}
                    >
                      {/* Checkbox & Details */}
                      <div className="flex items-start gap-3 min-w-0">
                        {/* Checkbox */}
                        <button
                          type="button"
                          onClick={() => handleToggleSelect(exp.id)}
                          className="mt-1 p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
                          aria-label={isSelected ? 'Deselect item' : 'Select item'}
                        >
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <Square className="w-5 h-5 text-slate-500 hover:text-slate-300" />
                          )}
                        </button>

                        {/* Category Icon */}
                        <div
                          className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 mt-0.5"
                          style={{
                            backgroundColor: `${parentCat?.color || '#10b981'}15`,
                            color: parentCat?.color || '#10b981'
                          }}
                        >
                          <IconRenderer name={parentCat?.icon || 'Tag'} className="w-5 h-5" />
                        </div>

                        {/* Text Info */}
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-white truncate">
                            {exp.description}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                            <span className="font-medium text-emerald-400">
                              {cat?.name || 'Expense'}
                            </span>
                            {parentCat && parentCat.name !== cat?.name && (
                              <span className="text-slate-500 text-[10px]">({parentCat.name})</span>
                            )}
                            <span className="text-slate-600">•</span>
                            <span className="text-slate-400 text-[11px]">{pm.label}</span>
                            {exp.notes && (
                              <>
                                <span className="text-slate-600">•</span>
                                <span className="text-slate-400 italic text-[11px] truncate max-w-[150px]">
                                  "{exp.notes}"
                                </span>
                              </>
                            )}
                          </div>

                          {/* Tag chips */}
                          {Array.isArray(exp.tags) && exp.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {exp.tags.map((t) => (
                                <button
                                  key={t}
                                  onClick={() => setSelectedTag(t)}
                                  className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700"
                                >
                                  #{t}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Amount & Actions */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <div className="font-black text-sm sm:text-base text-white">
                            {formatCurrency(exp.amount, currency)}
                          </div>
                          {!groupByDate && (
                            <div className="text-[10px] text-slate-400">
                              {formatRelativeDate(exp.date)}
                            </div>
                          )}
                        </div>

                        {/* Quick Edit/Delete */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onEditExpense(exp)}
                            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-emerald-400 transition-colors"
                            title="Edit"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete "${exp.description}"?`)) {
                                onDeleteExpense(exp.id);
                              }
                            }}
                            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {filteredExpenses.length === 0 && (
          <div className="glass-card rounded-2xl p-12 text-center">
            <Search className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-300">No matching expenses found</h3>
            <p className="text-xs text-slate-500 mt-1">Try adjusting your filters or search keywords.</p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-emerald-400 rounded-xl"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Floating Action Bar when 1 or more items are selected */}
      {selectedIds.size > 0 && (
        <aside aria-label="Selected actions" className="fixed bottom-20 md:bottom-6 left-4 right-4 max-w-2xl mx-auto z-40 animate-slide-up">
          <div className="glass-modal rounded-2xl p-3.5 sm:p-4 shadow-2xl border border-emerald-500/40 bg-slate-900/95 backdrop-blur-2xl flex items-center justify-between gap-3">
            {/* Selection info */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                {selectedIds.size}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-xs sm:text-sm text-white truncate">
                  {selectedIds.size} {selectedIds.size === 1 ? 'entry' : 'entries'} selected
                </p>
                <p className="text-[11px] text-emerald-400 font-semibold truncate">
                  Total: {formatCurrency(selectedTotal, currency)}
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowBulkDeleteModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-500 hover:bg-rose-600 active:scale-95 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-500/25 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Selected</span>
              </button>

              <button
                onClick={handleClearSelection}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                title="Cancel selection"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Confirmation Modal for Bulk Deletion */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
            onClick={() => !isDeleting && setShowBulkDeleteModal(false)}
          />
          <div className="relative w-full max-w-md glass-modal rounded-3xl p-6 border border-rose-500/40 shadow-2xl z-10 animate-scale-up space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-3 rounded-2xl bg-rose-500/15">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base sm:text-lg text-white">Confirm Bulk Deletion</h3>
                <p className="text-xs text-rose-400">Permanent IndexedDB removal</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Are you sure you want to delete <strong className="text-white">{selectedIds.size} entries</strong> valued at <strong className="text-emerald-400">{formatCurrency(selectedTotal, currency)}</strong>?
            </p>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400">
              Safe execution: These records will be permanently removed from your local Dexie IndexedDB database. This action cannot be undone unless restored from a backup.
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowBulkDeleteModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleExecuteBulkDelete}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 active:scale-95 text-white text-xs font-bold shadow-lg shadow-rose-500/25 transition-all disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {isDeleting ? 'Deleting entries...' : `Delete ${selectedIds.size} Entries`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
