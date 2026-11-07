import React, { useState, useMemo } from 'react';
import { 
  FolderTree, 
  Plus, 
  Edit3, 
  Trash2, 
  GitMerge, 
  ChevronRight, 
  ChevronDown, 
  Tag, 
  Layers, 
  X, 
  Check, 
  AlertTriangle 
} from 'lucide-react';
import { db, addCategory, updateCategory, deleteCategory, mergeCategories } from '../../db/db';
import IconRenderer from '../common/IconRenderer';
import { useToast } from '../common/Toast';

const PRESET_COLORS = [
  '#10b981', '#059669', '#3b82f6', '#2563eb', 
  '#f59e0b', '#d97706', '#ec4899', '#db2777', 
  '#ef4444', '#dc2626', '#8b5cf6', '#7c3aed', 
  '#06b6d4', '#0891b2', '#14b8a6', '#0d9488'
];

const PRESET_ICONS = [
  'ShoppingCart', 'Home', 'Car', 'Utensils', 'HeartPulse', 
  'Gamepad2', 'ShoppingBag', 'GraduationCap', 'Coffee', 'Fuel', 
  'Briefcase', 'DollarSign', 'Package', 'Tag', 'Box', 'Zap', 'Wifi'
];

export default function CategoriesManagerView({ categories, expenses, onCategoriesChanged }) {
  const { showToast } = useToast();

  const [expandedNodes, setExpandedNodes] = useState({});
  const [modalMode, setModalMode] = useState(null); // 'add' | 'edit' | 'merge' | 'delete'
  const [activeCategory, setActiveCategory] = useState(null);
  const [parentForNewChild, setParentForNewChild] = useState(null);

  // Form states for Add/Edit
  const [catName, setCatName] = useState('');
  const [catColor, setCatColor] = useState('#10b981');
  const [catIcon, setCatIcon] = useState('Tag');
  const [catParentId, setCatParentId] = useState('');

  // Form states for Merge
  const [mergeSourceId, setMergeSourceId] = useState('');
  const [mergeTargetId, setMergeTargetId] = useState('');

  // Build hierarchical category tree
  const categoryTree = useMemo(() => {
    const map = new Map();
    const roots = [];

    categories.forEach(c => map.set(c.id, { ...c, children: [] }));

    categories.forEach(c => {
      const node = map.get(c.id);
      if (c.parentId && map.has(c.parentId)) {
        map.get(c.parentId).children.push(node);
      } else {
        roots.push(node);
      }
    });

    return { roots, map };
  }, [categories]);

  // Count expenses per category
  const expenseCountMap = useMemo(() => {
    const counts = {};
    expenses.forEach(e => {
      if (e.categoryId) counts[e.categoryId] = (counts[e.categoryId] || 0) + 1;
      if (e.subcategoryId && e.subcategoryId !== e.categoryId) {
        counts[e.subcategoryId] = (counts[e.subcategoryId] || 0) + 1;
      }
    });
    return counts;
  }, [expenses]);

  const toggleExpand = (id) => {
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Open Add modal
  const handleOpenAdd = (parent = null) => {
    setParentForNewChild(parent);
    setCatName('');
    setCatColor(parent?.color || '#10b981');
    setCatIcon('Tag');
    setCatParentId(parent ? parent.id : '');
    setModalMode('add');
  };

  // Open Edit modal
  const handleOpenEdit = (category) => {
    setActiveCategory(category);
    setCatName(category.name);
    setCatColor(category.color || '#10b981');
    setCatIcon(category.icon || 'Tag');
    setCatParentId(category.parentId || '');
    setModalMode('edit');
  };

  // Open Merge modal
  const handleOpenMerge = (source = null) => {
    setMergeSourceId(source ? source.id : categories[0]?.id || '');
    const other = categories.find(c => c.id !== source?.id);
    setMergeTargetId(other?.id || '');
    setModalMode('merge');
  };

  // Open Delete confirmation
  const handleOpenDelete = (category) => {
    setActiveCategory(category);
    setModalMode('delete');
  };

  // Save Add or Edit
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!catName.trim()) {
      showToast('Category name is required', 'error');
      return;
    }

    try {
      if (modalMode === 'add') {
        await addCategory({
          name: catName,
          parentId: catParentId || null,
          color: catColor,
          icon: catIcon
        });
        showToast(`Category "${catName}" added successfully`, 'success');
      } else if (modalMode === 'edit') {
        await updateCategory(activeCategory.id, {
          name: catName.trim(),
          parentId: catParentId || null,
          color: catColor,
          icon: catIcon
        });
        showToast(`Category "${catName}" updated`, 'success');
      }
      setModalMode(null);
      if (onCategoriesChanged) onCategoriesChanged();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Execute Merge
  const handleExecuteMerge = async () => {
    if (!mergeSourceId || !mergeTargetId || mergeSourceId === mergeTargetId) {
      showToast('Please select two distinct categories to merge', 'error');
      return;
    }

    try {
      const result = await mergeCategories(mergeSourceId, mergeTargetId);
      showToast(
        `Merged "${result.sourceName}" into "${result.targetName}". Updated ${result.affectedExpenses} expenses.`,
        'success'
      );
      setModalMode(null);
      if (onCategoriesChanged) onCategoriesChanged();
    } catch (err) {
      showToast('Merge failed: ' + err.message, 'error');
    }
  };

  // Execute Delete
  const handleExecuteDelete = async () => {
    if (!activeCategory) return;
    try {
      await deleteCategory(activeCategory.id, true);
      showToast(`Category "${activeCategory.name}" and subcategories removed`, 'success');
      setModalMode(null);
      if (onCategoriesChanged) onCategoriesChanged();
    } catch (err) {
      showToast('Delete failed: ' + err.message, 'error');
    }
  };

  // Recursive Tree Node Renderer
  const renderTreeNode = (node, depth = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes[node.id] !== false; // default expanded
    const expCount = expenseCountMap[node.id] || 0;

    return (
      <div key={node.id} className="select-none">
        <div
          className={`group flex items-center justify-between p-2.5 rounded-xl transition-all border ${
            depth === 0
              ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
              : depth === 1
              ? 'bg-slate-900/50 border-slate-850 hover:border-slate-700 ml-4 sm:ml-6'
              : 'bg-slate-950/40 border-slate-900 hover:border-slate-800 ml-8 sm:ml-12'
          }`}
        >
          {/* Left: Expand Toggle + Icon + Name + Depth Badge */}
          <div className="flex items-center gap-2.5 min-w-0">
            {hasChildren ? (
              <button
                type="button"
                onClick={() => toggleExpand(node.id)}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            ) : (
              <span className="w-6" />
            )}

            <span
              className="w-3.5 h-3.5 rounded-full shrink-0"
              style={{ backgroundColor: node.color || '#10b981' }}
            />

            <div className="flex items-center gap-2 min-w-0">
              <span className={`font-semibold truncate text-white ${depth === 0 ? 'text-sm font-bold' : 'text-xs'}`}>
                {node.name}
              </span>
              <span className="text-[10px] text-slate-500 font-medium px-1.5 py-0.5 rounded bg-slate-800/80">
                {expCount} {expCount === 1 ? 'expense' : 'expenses'}
              </span>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Add Subcategory (Up to 3 levels) */}
            {depth < 2 && (
              <button
                onClick={() => handleOpenAdd(node)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-emerald-400 transition-colors"
                title={`Add subcategory under ${node.name}`}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Merge */}
            <button
              onClick={() => handleOpenMerge(node)}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-sky-400 transition-colors"
              title="Merge into another category"
            >
              <GitMerge className="w-3.5 h-3.5" />
            </button>

            {/* Edit */}
            <button
              onClick={() => handleOpenEdit(node)}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition-colors"
              title="Edit category"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>

            {/* Delete */}
            <button
              onClick={() => handleOpenDelete(node)}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
              title="Delete category"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Children Render */}
        {hasChildren && isExpanded && (
          <div className="space-y-1 mt-1">
            {node.children.map(child => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Category Architecture
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Multi-Level Hierarchy
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Dynamically configure Parent &gt; Child &gt; Sub-child categories, merge, and organize
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenMerge(null)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-300 transition-colors"
          >
            <GitMerge className="w-3.5 h-3.5 text-sky-400" /> Merge Categories
          </button>

          <button
            onClick={() => handleOpenAdd(null)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/25 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" /> Add Root Category
          </button>
        </div>
      </div>

      {/* Info Callout */}
      <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 text-xs text-slate-300 flex items-start gap-3">
        <Layers className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-white block font-semibold mb-0.5">
            Hierarchical Depth &amp; Dynamic Merge:
          </strong>
          Expenses can be assigned at any level (e.g. <span className="text-emerald-400">Grocery &gt; Daal &amp; Pulses &gt; Daal Channa</span>). Merging two categories seamlessly reassigns all historical expenses and child records with zero data loss.
        </div>
      </div>

      {/* Category Tree View */}
      <div className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-800 space-y-2">
        {categoryTree.roots.map(rootNode => renderTreeNode(rootNode, 0))}

        {categoryTree.roots.length === 0 && (
          <div className="text-center py-12 text-slate-500 text-xs">
            No categories defined. Click "Add Root Category" to get started.
          </div>
        )}
      </div>

      {/* Add / Edit Category Modal */}
      {(modalMode === 'add' || modalMode === 'edit') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setModalMode(null)} />
          <div className="relative w-full max-w-md glass-modal rounded-3xl p-6 border border-slate-700 shadow-2xl z-10 animate-scale-up space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-lg text-white">
                {modalMode === 'add'
                  ? parentForNewChild
                    ? `Add Subcategory under "${parentForNewChild.name}"`
                    : 'Add Root Category'
                  : `Edit Category "${activeCategory?.name}"`}
              </h3>
              <button onClick={() => setModalMode(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Daal Moong, Metro Transit, Organic Milk"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Parent category selector (optional) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Parent Category (Leave empty for root)
                </label>
                <select
                  value={catParentId}
                  onChange={(e) => setCatParentId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 outline-none focus:border-emerald-500"
                >
                  <option value="">None (Top-level Root Category)</option>
                  {categories
                    .filter(c => modalMode === 'edit' ? c.id !== activeCategory?.id : true)
                    .map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
              </div>

              {/* Color Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Color Theme
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setCatColor(color)}
                      className={`w-7 h-7 rounded-full border-2 transition-transform ${
                        catColor === color ? 'scale-110 border-white' : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Icon Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Icon
                </label>
                <div className="grid grid-cols-6 gap-2 max-h-32 overflow-y-auto p-1 bg-slate-950/60 rounded-xl border border-slate-800">
                  {PRESET_ICONS.map(iconName => (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => setCatIcon(iconName)}
                      className={`p-2 rounded-lg flex items-center justify-center transition-colors ${
                        catIcon === iconName ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <IconRenderer name={iconName} className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 active:scale-95"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Merge Categories Modal */}
      {modalMode === 'merge' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setModalMode(null)} />
          <div className="relative w-full max-w-md glass-modal rounded-3xl p-6 border border-slate-700 shadow-2xl z-10 animate-scale-up space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <GitMerge className="w-5 h-5 text-sky-400" /> Merge Categories
              </h3>
              <button onClick={() => setModalMode(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Consolidate duplicate or redundant categories. All expenses and subcategories from the <strong>Source Category</strong> will be reassigned to the <strong>Target Category</strong>, and the Source Category will be removed.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  1. Source Category (To be merged and removed):
                </label>
                <select
                  value={mergeSourceId}
                  onChange={(e) => setMergeSourceId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-rose-300 outline-none font-semibold"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id} className="text-white">
                      {c.name} ({expenseCountMap[c.id] || 0} expenses)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  2. Target Destination Category (Will keep all expenses):
                </label>
                <select
                  value={mergeTargetId}
                  onChange={(e) => setMergeTargetId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-emerald-300 outline-none font-semibold"
                >
                  {categories
                    .filter(c => c.id !== mergeSourceId)
                    .map(c => (
                      <option key={c.id} value={c.id} className="text-white">
                        {c.name} ({expenseCountMap[c.id] || 0} expenses)
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setModalMode(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteMerge}
                className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-slate-950 text-xs font-bold shadow-lg shadow-sky-500/20 active:scale-95"
              >
                Confirm &amp; Merge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {modalMode === 'delete' && activeCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setModalMode(null)} />
          <div className="relative w-full max-w-sm glass-modal rounded-3xl p-6 border border-rose-500/30 shadow-2xl z-10 animate-scale-up space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 rounded-xl bg-rose-500/10">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-white">Delete Category</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to delete <strong>"{activeCategory.name}"</strong>? Any child subcategories will also be deleted.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setModalMode(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteDelete}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold active:scale-95 transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
