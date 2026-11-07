import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Plus, 
  Check, 
  Calendar, 
  Tag as TagIcon, 
  Layers, 
  FileText, 
  Hash, 
  ChevronRight,
  Coins
} from 'lucide-react';
import { db } from '../../db/db';
import { PAYMENT_METHODS, normalizeTags, CURRENCIES } from '../../utils/formatters';
import IconRenderer from '../common/IconRenderer';
import { useToast } from '../common/Toast';

const SUGGESTED_TAGS = ['grocery', 'daal', 'urgent', 'cash', 'monthly', 'weekend', 'tax-deductible', 'online'];

export default function ExpenseModal({ isOpen, onClose, expenseToEdit = null, currency = 'USD' }) {
  const { showToast } = useToast();

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedParentId, setSelectedParentId] = useState('');
  const [selectedSubId, setSelectedSubId] = useState('');
  const [selectedChildSubId, setSelectedChildSubId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [notes, setNotes] = useState('');

  const [categories, setCategories] = useState([]);

  // Load all categories
  useEffect(() => {
    async function loadCats() {
      const all = await db.categories.toArray();
      setCategories(all);
    }
    if (isOpen) {
      loadCats();
    }
  }, [isOpen]);

  // Hierarchical category filtering
  const rootCategories = useMemo(() => {
    return categories.filter(c => !c.parentId);
  }, [categories]);

  const subCategories = useMemo(() => {
    if (!selectedParentId) return [];
    return categories.filter(c => c.parentId === selectedParentId);
  }, [categories, selectedParentId]);

  const childSubCategories = useMemo(() => {
    if (!selectedSubId) return [];
    return categories.filter(c => c.parentId === selectedSubId);
  }, [categories, selectedSubId]);

  // Populate form on edit
  useEffect(() => {
    if (expenseToEdit && categories.length > 0) {
      setAmount(String(expenseToEdit.amount || ''));
      setDescription(expenseToEdit.description || '');
      setDate(expenseToEdit.date || new Date().toISOString().split('T')[0]);
      setPaymentMethod(expenseToEdit.paymentMethod || 'cash');
      setTags(Array.isArray(expenseToEdit.tags) ? expenseToEdit.tags : []);
      setNotes(expenseToEdit.notes || '');

      // Resolve category hierarchy
      const catMap = new Map(categories.map(c => [c.id, c]));
      const targetSubId = expenseToEdit.subcategoryId;
      const targetCatId = expenseToEdit.categoryId;

      const subCat = targetSubId ? catMap.get(targetSubId) : null;
      if (subCat) {
        // Check if subCat is a 2nd level subcategory (grandchild)
        const parentOfSub = subCat.parentId ? catMap.get(subCat.parentId) : null;
        if (parentOfSub && parentOfSub.parentId) {
          // 3-level depth: root -> parentOfSub -> subCat
          setSelectedParentId(parentOfSub.parentId);
          setSelectedSubId(parentOfSub.id);
          setSelectedChildSubId(subCat.id);
        } else if (parentOfSub) {
          // 2-level depth: root -> subCat
          setSelectedParentId(parentOfSub.id);
          setSelectedSubId(subCat.id);
          setSelectedChildSubId('');
        }
      } else if (targetCatId) {
        setSelectedParentId(targetCatId);
        setSelectedSubId('');
        setSelectedChildSubId('');
      }
    } else if (!expenseToEdit && categories.length > 0) {
      // Default reset
      setAmount('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
      setSelectedParentId(rootCategories[0]?.id || '');
      setSelectedSubId('');
      setSelectedChildSubId('');
      setPaymentMethod('cash');
      setTags([]);
      setTagInput('');
      setNotes('');
    }
  }, [expenseToEdit, categories, isOpen, rootCategories]);

  // Handle parent category selection change
  const handleParentChange = (parentId) => {
    setSelectedParentId(parentId);
    const directChildren = categories.filter(c => c.parentId === parentId);
    if (directChildren.length > 0) {
      setSelectedSubId(directChildren[0].id);
      const subChildren = categories.filter(c => c.parentId === directChildren[0].id);
      setSelectedChildSubId(subChildren[0]?.id || '');
    } else {
      setSelectedSubId('');
      setSelectedChildSubId('');
    }
  };

  // Handle subcategory selection change
  const handleSubChange = (subId) => {
    setSelectedSubId(subId);
    const subChildren = categories.filter(c => c.parentId === subId);
    setSelectedChildSubId(subChildren[0]?.id || '');
  };

  // Tag management
  const handleAddTag = (rawTag) => {
    const clean = rawTag.replace(/^#+/, '').trim().toLowerCase();
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag(tagInput);
    }
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      showToast('Please enter a valid amount greater than 0', 'error');
      return;
    }

    if (!selectedParentId) {
      showToast('Please choose a category', 'error');
      return;
    }

    // Determine target category IDs
    const finalCategoryId = selectedParentId;
    const finalSubcategoryId = selectedChildSubId || selectedSubId || selectedParentId;

    const expensePayload = {
      amount: parsedAmount,
      date,
      categoryId: finalCategoryId,
      subcategoryId: finalSubcategoryId,
      description: description.trim() || 'Expense',
      tags: normalizeTags(tags),
      paymentMethod,
      notes: notes.trim(),
      updatedAt: new Date().toISOString(),
      synced: 0
    };

    try {
      if (expenseToEdit) {
        await db.expenses.update(expenseToEdit.id, expensePayload);
        showToast('Expense updated successfully', 'success');
      } else {
        const id = 'exp-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
        await db.expenses.add({
          id,
          ...expensePayload,
          createdAt: new Date().toISOString()
        });
        showToast('Expense recorded successfully', 'success');
      }
      onClose();
    } catch (err) {
      showToast('Error saving expense: ' + err.message, 'error');
    }
  };

  if (!isOpen) return null;

  const currentCurrency = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg glass-modal rounded-3xl shadow-2xl border border-slate-700/80 p-5 sm:p-6 overflow-hidden max-h-[92vh] flex flex-col z-10 animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              {currentCurrency.symbol}
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">
                {expenseToEdit ? 'Edit Expense' : 'Quick Add Expense'}
              </h3>
              <p className="text-xs text-slate-400">IndexedDB Zero-Latency Storage</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {/* Amount Input with Quick Add Increments */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Amount ({currentCurrency.code})
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-xl font-bold text-emerald-400">
                {currentCurrency.symbol}
              </span>
              <input
                type="number"
                step="any"
                min="0"
                autoFocus
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-2xl font-black text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            {/* Quick Amount Add Buttons */}
            <div className="flex items-center gap-2 mt-2">
              {[10, 25, 50, 100].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmount(prev => String((parseFloat(prev) || 0) + val))}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 active:scale-95 transition-transform"
                >
                  +{val}
                </button>
              ))}
            </div>
          </div>

          {/* Description & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Description
              </label>
              <input
                type="text"
                placeholder="e.g. Daal Channa 2kg, Fuel, Coffee"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Hierarchical Category & Subcategory Picker */}
          <div className="space-y-3 bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-400" /> Multi-level Category
              </span>
              {/* Breadcrumb Preview */}
              <span className="text-[11px] text-emerald-400 font-medium truncate max-w-[200px]">
                {categories.find(c => c.id === selectedParentId)?.name}
                {selectedSubId && ` > ${categories.find(c => c.id === selectedSubId)?.name}`}
                {selectedChildSubId && ` > ${categories.find(c => c.id === selectedChildSubId)?.name}`}
              </span>
            </div>

            {/* Level 1: Root Parent Category */}
            <div>
              <span className="block text-[11px] text-slate-400 mb-1">Primary Category:</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {rootCategories.map((cat) => {
                  const isSelected = selectedParentId === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleParentChange(cat.id)}
                      className={`flex items-center gap-2 p-2 rounded-xl text-xs font-medium border transition-all text-left ${
                        isSelected
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-sm'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <span 
                        className="w-2.5 h-2.5 rounded-full shrink-0" 
                        style={{ backgroundColor: cat.color || '#10b981' }} 
                      />
                      <span className="truncate">{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Level 2: Subcategory (e.g. Daal, Fruits, etc.) */}
            {subCategories.length > 0 && (
              <div>
                <span className="block text-[11px] text-slate-400 mb-1">Subcategory:</span>
                <div className="flex flex-wrap gap-1.5">
                  {subCategories.map((sub) => {
                    const isSelected = selectedSubId === sub.id;
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => handleSubChange(sub.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          isSelected
                            ? 'bg-teal-500/20 border-teal-500 text-teal-200'
                            : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-300'
                        }`}
                      >
                        {sub.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Level 3: Nested Sub-child (e.g. Daal Channa, Daal Moong) */}
            {childSubCategories.length > 0 && (
              <div>
                <span className="block text-[11px] text-slate-400 mb-1">Specific Item / Type:</span>
                <div className="flex flex-wrap gap-1.5">
                  {childSubCategories.map((child) => {
                    const isSelected = selectedChildSubId === child.id;
                    return (
                      <button
                        key={child.id}
                        type="button"
                        onClick={() => setSelectedChildSubId(child.id)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-emerald-400 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                            : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        {child.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Payment Method
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {PAYMENT_METHODS.map((method) => {
                const isSelected = paymentMethod === method.id;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setPaymentMethod(method.id)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl text-xs font-medium border transition-all ${
                      isSelected
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <IconRenderer name={method.icon} className="w-4 h-4 mb-1" />
                    <span className="text-[11px] truncate">{method.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Tags Support */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Tags (#urgent, #cash, #grocery)
            </label>
            <div className="flex items-center gap-2 mb-2">
              <div className="relative flex-1">
                <Hash className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Type tag and press Enter"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  className="w-full pl-9 pr-3 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <button
                type="button"
                onClick={() => handleAddTag(tagInput)}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 active:scale-95"
              >
                Add
              </button>
            </div>

            {/* Active Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                  >
                    #{t}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="hover:text-rose-400 ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Suggested Quick Tag Pills */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
              <span className="text-[10px] text-slate-500">Quick suggestions:</span>
              {SUGGESTED_TAGS.map((stag) => (
                <button
                  key={stag}
                  type="button"
                  onClick={() => handleAddTag(stag)}
                  className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800/80 hover:bg-slate-700 hover:text-emerald-300 text-slate-400 transition-colors"
                >
                  #{stag}
                </button>
              ))}
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Notes (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Add store name, warranty details, split bill notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 text-sm font-bold shadow-lg shadow-emerald-500/25 active:scale-95 transition-all"
            >
              {expenseToEdit ? 'Save Changes' : 'Record Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
