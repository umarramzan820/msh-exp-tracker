import { findRootCategory } from '../db/db';

// Helper to convert Date to YYYY-MM-DD in local time
export function toLocalDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Compute start and end date ranges for a given timeframe filter
export function getTimeframeDateRange(timeframe, customStart = null, customEnd = null) {
  const now = new Date();
  let start = new Date(now);
  let end = new Date(now);

  switch (timeframe) {
    case 'today':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      break;

    case 'yesterday':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
      break;

    case 'this_week': {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      start = new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      break;
    }

    case 'last_week': {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1) - 7;
      start = new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), diff + 6, 23, 59, 59, 999);
      break;
    }

    case 'this_month':
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      break;

    case 'last_month':
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      break;

    case 'this_year':
      start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      break;

    case 'all_time':
      start = new Date(2000, 0, 1, 0, 0, 0, 0);
      end = new Date(2099, 11, 31, 23, 59, 59, 999);
      break;

    case 'custom':
      if (customStart && customEnd) {
        start = new Date(customStart + 'T00:00:00');
        end = new Date(customEnd + 'T23:59:59');
      }
      break;

    default:
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  }

  return {
    startDateStr: toLocalDateString(start),
    endDateStr: toLocalDateString(end),
    startDate: start,
    endDate: end
  };
}

// Extract all unique months present in expenses + current month
export function getAvailableMonths(expenses = []) {
  const monthMap = new Map();
  const now = new Date();
  const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  // Format helper
  const formatMonthName = (key) => {
    const [year, month] = key.split('-').map(Number);
    const d = new Date(year, month - 1, 1);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Add current month
  monthMap.set(currentKey, formatMonthName(currentKey));

  // Add months from expenses
  expenses.forEach(exp => {
    if (exp.date) {
      const ym = exp.date.substring(0, 7); // YYYY-MM
      if (/^\d{4}-\d{2}$/.test(ym) && !monthMap.has(ym)) {
        monthMap.set(ym, formatMonthName(ym));
      }
    }
  });

  // Sort descending by month key (most recent first)
  const sortedKeys = Array.from(monthMap.keys()).sort().reverse();
  return sortedKeys.map(key => ({
    key,
    label: monthMap.get(key)
  }));
}

// Compute date boundary for a specific year-month string (e.g. "2026-11")
export function getMonthDateRange(yearMonthStr) {
  if (!yearMonthStr || !/^\d{4}-\d{2}$/.test(yearMonthStr)) {
    const now = new Date();
    yearMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  const [year, month] = yearMonthStr.split('-').map(Number);
  const start = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0).getDate();
  const end = new Date(year, month - 1, lastDay);

  const now = new Date();
  const isCurrentMonth = now.getFullYear() === year && (now.getMonth() + 1) === month;
  const daysElapsed = isCurrentMonth ? now.getDate() : lastDay;

  return {
    startDateStr: `${yearMonthStr}-01`,
    endDateStr: `${yearMonthStr}-${String(lastDay).padStart(2, '0')}`,
    startDate: start,
    endDate: end,
    daysInMonth: lastDay,
    daysElapsed: Math.max(1, daysElapsed),
    isCurrentMonth,
    year,
    month
  };
}

// Filter expenses within a date range string [start, end]
export function filterExpensesByDateRange(expenses, startDateStr, endDateStr) {
  return expenses.filter(exp => {
    return exp.date >= startDateStr && exp.date <= endDateStr;
  });
}

// Compute Week-over-Week (WoW) comparison
export function calculateWoW(expenses) {
  const now = new Date();
  const day = now.getDay();
  const currentWeekMonday = now.getDate() - day + (day === 0 ? -6 : 1);

  const thisWeekStart = new Date(now.getFullYear(), now.getMonth(), currentWeekMonday);
  const thisWeekEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const lastWeekStart = new Date(now.getFullYear(), now.getMonth(), currentWeekMonday - 7);
  const lastWeekEnd = new Date(now.getFullYear(), now.getMonth(), currentWeekMonday - 1);

  const thisWeekStrStart = toLocalDateString(thisWeekStart);
  const thisWeekStrEnd = toLocalDateString(thisWeekEnd);

  const lastWeekStrStart = toLocalDateString(lastWeekStart);
  const lastWeekStrEnd = toLocalDateString(lastWeekEnd);

  const thisWeekTotal = expenses
    .filter(e => e.date >= thisWeekStrStart && e.date <= thisWeekStrEnd)
    .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

  const lastWeekTotal = expenses
    .filter(e => e.date >= lastWeekStrStart && e.date <= lastWeekStrEnd)
    .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

  let percentChange = 0;
  if (lastWeekTotal > 0) {
    percentChange = ((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100;
  } else if (thisWeekTotal > 0) {
    percentChange = 100;
  }

  return {
    thisWeekTotal,
    lastWeekTotal,
    percentChange: parseFloat(percentChange.toFixed(1)),
    isIncrease: thisWeekTotal > lastWeekTotal,
    difference: thisWeekTotal - lastWeekTotal
  };
}

// Compute Month-over-Month (MoM) comparison
export function calculateMoM(expenses, targetMonthKey = null) {
  let targetYear, targetMonth;

  if (targetMonthKey && /^\d{4}-\d{2}$/.test(targetMonthKey)) {
    const parts = targetMonthKey.split('-').map(Number);
    targetYear = parts[0];
    targetMonth = parts[1];
  } else {
    const now = new Date();
    targetYear = now.getFullYear();
    targetMonth = now.getMonth() + 1;
  }

  // Target month range
  const daysInTarget = new Date(targetYear, targetMonth, 0).getDate();
  const targetStartStr = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;
  const targetEndStr = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(daysInTarget).padStart(2, '0')}`;

  // Prior month range
  const priorDate = new Date(targetYear, targetMonth - 2, 1);
  const priorYear = priorDate.getFullYear();
  const priorMonth = priorDate.getMonth() + 1;
  const daysInPrior = new Date(priorYear, priorMonth, 0).getDate();
  const priorStartStr = `${priorYear}-${String(priorMonth).padStart(2, '0')}-01`;
  const priorEndStr = `${priorYear}-${String(priorMonth).padStart(2, '0')}-${String(daysInPrior).padStart(2, '0')}`;

  const thisMonthTotal = expenses
    .filter(e => e.date >= targetStartStr && e.date <= targetEndStr)
    .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

  const lastMonthTotal = expenses
    .filter(e => e.date >= priorStartStr && e.date <= priorEndStr)
    .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

  let percentChange = 0;
  if (lastMonthTotal > 0) {
    percentChange = ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100;
  } else if (thisMonthTotal > 0) {
    percentChange = 100;
  }

  // Daily average
  const now = new Date();
  const isCurrentMonth = now.getFullYear() === targetYear && (now.getMonth() + 1) === targetMonth;
  const daysPassed = isCurrentMonth ? now.getDate() : daysInTarget;
  const dailyAverage = daysPassed > 0 ? thisMonthTotal / daysPassed : thisMonthTotal;

  return {
    thisMonthTotal,
    lastMonthTotal,
    percentChange: parseFloat(percentChange.toFixed(1)),
    isIncrease: thisMonthTotal > lastMonthTotal,
    difference: thisMonthTotal - lastMonthTotal,
    dailyAverage,
    daysPassed
  };
}

// Aggregation by Category
export function aggregateExpensesByCategory(expenses, categories, mode = 'consolidated', activeParentId = null) {
  const catMap = new Map(categories.map(c => [c.id, c]));
  const totals = {};

  expenses.forEach(exp => {
    const amount = parseFloat(exp.amount) || 0;
    let targetCat = null;

    if (activeParentId) {
      const expCat = catMap.get(exp.subcategoryId) || catMap.get(exp.categoryId);
      if (!expCat) return;

      let belongs = false;
      let curr = expCat;
      while (curr) {
        if (curr.id === activeParentId) {
          belongs = true;
          break;
        }
        curr = curr.parentId ? catMap.get(curr.parentId) : null;
      }

      if (belongs) {
        let directChild = expCat;
        while (directChild && directChild.parentId !== activeParentId) {
          directChild = directChild.parentId ? catMap.get(directChild.parentId) : null;
        }
        targetCat = directChild || expCat;
      }
    } else if (mode === 'consolidated') {
      const expCatId = exp.categoryId || exp.subcategoryId;
      targetCat = findRootCategory(expCatId, catMap) || { id: 'uncategorized', name: 'Other', color: '#94a3b8' };
    } else {
      const expCatId = exp.subcategoryId || exp.categoryId;
      targetCat = catMap.get(expCatId) || { id: 'uncategorized', name: 'Other', color: '#94a3b8' };
    }

    if (targetCat) {
      if (!totals[targetCat.id]) {
        totals[targetCat.id] = {
          id: targetCat.id,
          name: targetCat.name,
          color: targetCat.color || '#10b981',
          icon: targetCat.icon || 'Tag',
          amount: 0,
          count: 0
        };
      }
      totals[targetCat.id].amount += amount;
      totals[targetCat.id].count += 1;
    }
  });

  const grandTotal = Object.values(totals).reduce((sum, item) => sum + item.amount, 0);

  const sortedList = Object.values(totals)
    .map(item => ({
      ...item,
      percentage: grandTotal > 0 ? parseFloat(((item.amount / grandTotal) * 100).toFixed(1)) : 0
    }))
    .sort((a, b) => b.amount - a.amount);

  return {
    items: sortedList,
    grandTotal
  };
}

// Compute spending trend data for charts
export function calculateSpendingTrend(expenses, startDateStr, endDateStr) {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  const dayMap = {};
  const curr = new Date(start);

  while (curr <= end) {
    const key = toLocalDateString(curr);
    dayMap[key] = 0;
    curr.setDate(curr.getDate() + 1);
  }

  expenses.forEach(exp => {
    if (dayMap[exp.date] !== undefined) {
      dayMap[exp.date] += parseFloat(exp.amount) || 0;
    }
  });

  const labels = Object.keys(dayMap).map(d => {
    const parts = d.split('-');
    return `${parts[1]}/${parts[2]}`; // MM/DD
  });

  const data = Object.values(dayMap);

  return { labels, data, rawDates: Object.keys(dayMap) };
}

// Comparative dual-bar chart
export function calculateComparativeCategories(currentExpenses, previousExpenses, categories) {
  const catMap = new Map(categories.map(c => [c.id, c]));

  const currentTotals = {};
  const previousTotals = {};

  currentExpenses.forEach(e => {
    const root = findRootCategory(e.categoryId || e.subcategoryId, catMap) || { id: 'other', name: 'Other' };
    currentTotals[root.name] = (currentTotals[root.name] || 0) + (parseFloat(e.amount) || 0);
  });

  previousExpenses.forEach(e => {
    const root = findRootCategory(e.categoryId || e.subcategoryId, catMap) || { id: 'other', name: 'Other' };
    previousTotals[root.name] = (previousTotals[root.name] || 0) + (parseFloat(e.amount) || 0);
  });

  const allCategoryNames = Array.from(new Set([...Object.keys(currentTotals), ...Object.keys(previousTotals)]));

  const items = allCategoryNames.map(name => {
    const curr = currentTotals[name] || 0;
    const prev = previousTotals[name] || 0;
    const diff = curr - prev;
    const percent = prev > 0 ? ((diff / prev) * 100) : (curr > 0 ? 100 : 0);
    return {
      category: name,
      current: parseFloat(curr.toFixed(2)),
      previous: parseFloat(prev.toFixed(2)),
      difference: parseFloat(diff.toFixed(2)),
      percentChange: parseFloat(percent.toFixed(1))
    };
  });

  items.sort((a, b) => b.current - a.current);

  return items;
}
