import Dexie from 'dexie';

export class ExpenseTrackerDatabase extends Dexie {
  constructor() {
    super('ExpensioDB');

    // Version 1: Original Schema
    this.version(1).stores({
      categories: 'id, parentId, name, order',
      expenses: 'id, amount, date, categoryId, subcategoryId, paymentMethod, createdAt, updatedAt, synced',
      budgets: 'id, categoryId, period',
      settings: 'key'
    });

    // Version 2: Unified Financial Suite (Credits, Debts, Committees, Installments & Transactions)
    this.version(2).stores({
      categories: 'id, parentId, name, order',
      expenses: 'id, amount, date, categoryId, subcategoryId, paymentMethod, createdAt, updatedAt, synced',
      budgets: 'id, categoryId, period',
      settings: 'key',
      credits: 'id, personName, phone, type, category, status, dueDate, startDate, payoutDate, createdAt, updatedAt',
      creditTransactions: 'id, creditId, type, date, createdAt'
    });
  }
}

export const db = new ExpenseTrackerDatabase();

// Default seed categories (Hierarchical: Parent -> Child -> Sub-child)
export const DEFAULT_CATEGORIES = [
  // Grocery hierarchy
  { id: 'cat-grocery', parentId: null, name: 'Grocery & Ration', icon: 'ShoppingCart', color: '#10b981', order: 1 },
  { id: 'sub-daal', parentId: 'cat-grocery', name: 'Daal & Pulses', icon: 'Package', color: '#34d399', order: 1 },
  { id: 'sub-daal-channa', parentId: 'sub-daal', name: 'Daal Channa', icon: 'Tag', color: '#6ee7b7', order: 1 },
  { id: 'sub-daal-moong', parentId: 'sub-daal', name: 'Daal Moong', icon: 'Tag', color: '#6ee7b7', order: 2 },
  { id: 'sub-daal-masoor', parentId: 'sub-daal', name: 'Daal Masoor', icon: 'Tag', color: '#6ee7b7', order: 3 },
  { id: 'sub-fruits-veg', parentId: 'cat-grocery', name: 'Fruits & Veggies', icon: 'Apple', color: '#34d399', order: 2 },
  { id: 'sub-dairy', parentId: 'cat-grocery', name: 'Dairy & Milk', icon: 'Milk', color: '#34d399', order: 3 },
  { id: 'sub-spices', parentId: 'cat-grocery', name: 'Spices & Cooking Oil', icon: 'Box', color: '#34d399', order: 4 },

  // Housing hierarchy
  { id: 'cat-housing', parentId: null, name: 'Housing & Utilities', icon: 'Home', color: '#3b82f6', order: 2 },
  { id: 'sub-rent', parentId: 'cat-housing', name: 'House Rent', icon: 'Key', color: '#60a5fa', order: 1 },
  { id: 'sub-electricity', parentId: 'cat-housing', name: 'Electricity Bill', icon: 'Zap', color: '#60a5fa', order: 2 },
  { id: 'sub-gas-water', parentId: 'cat-housing', name: 'Sui Gas & Water', icon: 'Droplet', color: '#60a5fa', order: 3 },
  { id: 'sub-internet', parentId: 'cat-housing', name: 'WiFi Internet & Phone', icon: 'Wifi', color: '#60a5fa', order: 4 },

  // Transportation hierarchy
  { id: 'cat-transport', parentId: null, name: 'Transport & Fuel', icon: 'Car', color: '#f59e0b', order: 3 },
  { id: 'sub-fuel', parentId: 'cat-transport', name: 'Fuel / Petrol', icon: 'Fuel', color: '#fbbf24', order: 1 },
  { id: 'sub-rideshare', parentId: 'cat-transport', name: 'Ride Sharing (Uber/Bykea)', icon: 'Navigation', color: '#fbbf24', order: 2 },
  { id: 'sub-transit', parentId: 'cat-transport', name: 'Metro / Public Transit', icon: 'Bus', color: '#fbbf24', order: 3 },
  { id: 'sub-maintenance', parentId: 'cat-transport', name: 'Vehicle Maintenance', icon: 'Wrench', color: '#fbbf24', order: 4 },

  // Food & Dining
  { id: 'cat-dining', parentId: null, name: 'Dining & Outing', icon: 'Utensils', color: '#ec4899', order: 4 },
  { id: 'sub-restaurants', parentId: 'cat-dining', name: 'Family Dinners', icon: 'UtensilsCrossed', color: '#f472b6', order: 1 },
  { id: 'sub-cafes', parentId: 'cat-dining', name: 'Tea & Coffee Stalls', icon: 'Coffee', color: '#f472b6', order: 2 },
  { id: 'sub-fastfood', parentId: 'cat-dining', name: 'Fast Food & Snacks', icon: 'Pizza', color: '#f472b6', order: 3 },

  // Healthcare
  { id: 'cat-healthcare', parentId: null, name: 'Healthcare & Medical', icon: 'HeartPulse', color: '#ef4444', order: 5 },
  { id: 'sub-pharmacy', parentId: 'cat-healthcare', name: 'Pharmacy Medicines', icon: 'Pill', color: '#f87171', order: 1 },
  { id: 'sub-doctor', parentId: 'cat-healthcare', name: 'Doctor Fees & Labs', icon: 'Stethoscope', color: '#f87171', order: 2 },

  // Education & Learning
  { id: 'cat-education', parentId: null, name: 'Education & Fees', icon: 'GraduationCap', color: '#14b8a6', order: 6 },
  { id: 'sub-courses', parentId: 'cat-education', name: 'School / College Tuition', icon: 'BookOpen', color: '#2dd4bf', order: 1 },
  { id: 'sub-books', parentId: 'cat-education', name: 'Books & Supplies', icon: 'Bookmark', color: '#2dd4bf', order: 2 }
];

// Default sample expenses
export function generateSampleExpenses() {
  const now = new Date();
  const formatIsoDate = (d) => d.toISOString().split('T')[0];

  const daysAgo = (days) => {
    const d = new Date(now);
    d.setDate(d.getDate() - days);
    return formatIsoDate(d);
  };

  return [
    {
      id: 'exp-01',
      amount: 4500,
      date: daysAgo(0),
      categoryId: 'cat-grocery',
      subcategoryId: 'sub-daal-channa',
      description: 'Monthly Daal Channa 5kg & Spices Ration',
      tags: ['grocery', 'cash', 'daal'],
      paymentMethod: 'cash',
      notes: 'Purchased from whole sale market',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: 0
    },
    {
      id: 'exp-02',
      amount: 1200,
      date: daysAgo(0),
      categoryId: 'cat-dining',
      subcategoryId: 'sub-cafes',
      description: 'Chai & Snacks with Team',
      tags: ['tea', 'casual'],
      paymentMethod: 'digital_wallet',
      notes: 'Paid via Easypaisa',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: 0
    },
    {
      id: 'exp-03',
      amount: 8500,
      date: daysAgo(1),
      categoryId: 'cat-transport',
      subcategoryId: 'sub-fuel',
      description: 'Fuel Refill for Car',
      tags: ['fuel', 'weekly'],
      paymentMethod: 'credit_card',
      notes: 'PSO Station',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: 0
    },
    {
      id: 'exp-04',
      amount: 14500,
      date: daysAgo(2),
      categoryId: 'cat-housing',
      subcategoryId: 'sub-electricity',
      description: 'Electricity Utility Bill Payment',
      tags: ['utility', 'monthly', 'urgent'],
      paymentMethod: 'bank_transfer',
      notes: 'Paid online via HBL app',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: 0
    },
    {
      id: 'exp-05',
      amount: 3200,
      date: daysAgo(4),
      categoryId: 'cat-healthcare',
      subcategoryId: 'sub-pharmacy',
      description: 'Prescription Medicine Refill',
      tags: ['health', 'urgent'],
      paymentMethod: 'cash',
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: 0
    },
    {
      id: 'exp-06',
      amount: 6500,
      date: daysAgo(6),
      categoryId: 'cat-dining',
      subcategoryId: 'sub-restaurants',
      description: 'Weekend Family Dinner',
      tags: ['family', 'dinner'],
      paymentMethod: 'debit_card',
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: 0
    },
    // Last month records for MoM analysis
    {
      id: 'exp-07',
      amount: 35000,
      date: daysAgo(35),
      categoryId: 'cat-housing',
      subcategoryId: 'sub-rent',
      description: 'Monthly Apartment Rent',
      tags: ['rent', 'monthly'],
      paymentMethod: 'bank_transfer',
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: 0
    },
    {
      id: 'exp-08',
      amount: 18000,
      date: daysAgo(37),
      categoryId: 'cat-grocery',
      subcategoryId: 'sub-dairy',
      description: 'Bulk Grocery Stockup',
      tags: ['grocery', 'monthly'],
      paymentMethod: 'cash',
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: 0
    }
  ];
}

// Default sample credits & debts (Committees, Installments, Receivables & Payables)
export function generateSampleCredits() {
  const now = new Date();
  const formatIsoDate = (d) => d.toISOString().split('T')[0];

  const daysAhead = (days) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    return formatIsoDate(d);
  };

  const daysAgo = (days) => {
    const d = new Date(now);
    d.setDate(d.getDate() - days);
    return formatIsoDate(d);
  };

  return [
    {
      id: 'cred-01',
      personName: 'Society Ladies Committee (Kameti)',
      phone: '0300-1234567',
      type: 'payable', // I will pay / Dena hai
      category: 'committee',
      totalAmount: 100000,
      remainingAmount: 40000,
      monthlyInstallment: 10000,
      tenureMonths: 10,
      startDate: daysAgo(180),
      dueDate: daysAhead(5), // Due this week!
      payoutDate: daysAhead(60), // Will receive committee in 2 months
      payoutReceived: false,
      notes: '10 month committee. 6 months paid, 4 installments remaining. Payout scheduled for 8th month.',
      status: 'active',
      highestPeakAmount: 100000,
      highestPeakDate: daysAgo(180),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'cred-02',
      personName: 'Zubair Electronics (Bike Installment)',
      phone: '0321-7654321',
      type: 'payable', // I will pay / Dena hai
      category: 'installment',
      totalAmount: 150000,
      remainingAmount: 60000,
      monthlyInstallment: 15000,
      tenureMonths: 10,
      startDate: daysAgo(180),
      dueDate: daysAhead(12),
      payoutDate: null,
      payoutReceived: false,
      notes: 'Honda 125 10-month installment plan. 6 installments completed.',
      status: 'active',
      highestPeakAmount: 150000,
      highestPeakDate: daysAgo(180),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'cred-03',
      personName: 'Tariq Mehmood (Colleague Loan)',
      phone: '0333-9876543',
      type: 'receivable', // I will receive / Lena hai
      category: 'personal',
      totalAmount: 45000,
      remainingAmount: 30000,
      monthlyInstallment: 15000,
      tenureMonths: 3,
      startDate: daysAgo(40),
      dueDate: daysAhead(3), // Due this week!
      payoutDate: null,
      payoutReceived: false,
      notes: 'Lent for medical emergency. Paid 15k, 30k remaining.',
      status: 'active',
      highestPeakAmount: 45000,
      highestPeakDate: daysAgo(40),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'cred-04',
      personName: 'Bilal Cloth House (Wholesale Credit)',
      phone: '0345-4433221',
      type: 'receivable', // Lena hai
      category: 'business',
      totalAmount: 75000,
      remainingAmount: 75000,
      monthlyInstallment: 25000,
      tenureMonths: 3,
      startDate: daysAgo(50),
      dueDate: daysAgo(5), // Overdue!
      payoutDate: null,
      payoutReceived: false,
      notes: 'Invoice #889 for fabric supply. Payment delayed by 5 days.',
      status: 'overdue',
      highestPeakAmount: 75000,
      highestPeakDate: daysAgo(50),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
}

export function generateSampleCreditTransactions() {
  const now = new Date();
  const formatIsoDate = (d) => d.toISOString().split('T')[0];
  const daysAgo = (days) => {
    const d = new Date(now);
    d.setDate(d.getDate() - days);
    return formatIsoDate(d);
  };

  return [
    {
      id: 'ctx-01',
      creditId: 'cred-01',
      amount: 10000,
      type: 'payment',
      date: daysAgo(30),
      notes: '6th installment paid via Cash',
      createdAt: new Date().toISOString()
    },
    {
      id: 'ctx-02',
      creditId: 'cred-02',
      amount: 15000,
      type: 'payment',
      date: daysAgo(20),
      notes: 'Installment #6 paid via Bank Transfer',
      createdAt: new Date().toISOString()
    },
    {
      id: 'ctx-03',
      creditId: 'cred-03',
      amount: 15000,
      type: 'payment',
      date: daysAgo(10),
      notes: 'Partial repayment via Easypaisa',
      createdAt: new Date().toISOString()
    }
  ];
}

// Seed the database if empty
export async function initDatabase() {
  const catCount = await db.categories.count();
  if (catCount === 0) {
    await db.categories.bulkAdd(DEFAULT_CATEGORIES);
  }

  const expCount = await db.expenses.count();
  if (expCount === 0) {
    const sampleExpenses = generateSampleExpenses();
    await db.expenses.bulkAdd(sampleExpenses);
  }

  const credCount = await db.credits.count();
  if (credCount === 0) {
    const sampleCredits = generateSampleCredits();
    await db.credits.bulkAdd(sampleCredits);

    const sampleTxs = generateSampleCreditTransactions();
    await db.creditTransactions.bulkAdd(sampleTxs);
  }

  // Set default settings if not exists (Default currency: PKR)
  const currencySetting = await db.settings.get('currency');
  if (!currencySetting) {
    await db.settings.put({ key: 'currency', value: 'PKR' });
  }

  const themeSetting = await db.settings.get('theme');
  if (!themeSetting) {
    await db.settings.put({ key: 'theme', value: 'dark' });
  }

  const syncSetting = await db.settings.get('cloudSync');
  if (!syncSetting) {
    await db.settings.put({
      key: 'cloudSync',
      value: {
        enabled: false,
        provider: 'supabase',
        endpoint: '',
        apiKey: '',
        lastSyncTime: null,
        autoSync: false
      }
    });
  }
}

// ==================== CREDIT & DEBT LEDGER OPERATIONS ====================

export async function addCredit(creditData) {
  const id = 'cred-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
  const amount = parseFloat(creditData.totalAmount) || 0;
  const startDate = creditData.startDate || new Date().toISOString().split('T')[0];

  const newCredit = {
    id,
    personName: creditData.personName.trim(),
    phone: creditData.phone ? creditData.phone.trim() : '',
    type: creditData.type || 'payable', // 'receivable' | 'payable'
    category: creditData.category || 'personal', // 'personal' | 'committee' | 'installment' | 'business'
    totalAmount: amount,
    remainingAmount: parseFloat(creditData.remainingAmount ?? amount),
    monthlyInstallment: parseFloat(creditData.monthlyInstallment) || 0,
    tenureMonths: parseInt(creditData.tenureMonths) || 0,
    startDate,
    dueDate: creditData.dueDate || '',
    payoutDate: creditData.payoutDate || '',
    payoutReceived: Boolean(creditData.payoutReceived),
    notes: creditData.notes ? creditData.notes.trim() : '',
    status: 'active',
    highestPeakAmount: amount,
    highestPeakDate: startDate,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await db.credits.add(newCredit);
  return newCredit;
}

export async function updateCredit(id, updates) {
  const existing = await db.credits.get(id);
  if (!existing) throw new Error('Credit record not found');

  const payload = {
    ...updates,
    updatedAt: new Date().toISOString()
  };

  await db.credits.update(id, payload);
  return db.credits.get(id);
}

export async function deleteCredit(id) {
  await db.transaction('rw', db.credits, db.creditTransactions, async () => {
    await db.creditTransactions.where('creditId').equals(id).delete();
    await db.credits.delete(id);
  });
}

// Log a transaction in Credit/Debt Ledger (Payment or Additional Credit)
export async function addCreditTransaction({ creditId, amount, type, date, notes }) {
  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    throw new Error('Please enter a valid transaction amount');
  }

  return await db.transaction('rw', db.credits, db.creditTransactions, async () => {
    const credit = await db.credits.get(creditId);
    if (!credit) throw new Error('Credit record not found');

    const txId = 'ctx-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    const txDate = date || new Date().toISOString().split('T')[0];

    const newTx = {
      id: txId,
      creditId,
      amount: parsedAmount,
      type: type || 'payment', // 'payment' | 'additional_credit'
      date: txDate,
      notes: notes ? notes.trim() : '',
      createdAt: new Date().toISOString()
    };

    await db.creditTransactions.add(newTx);

    let newRemaining = credit.remainingAmount;
    let newTotal = credit.totalAmount;
    let newHighestPeak = credit.highestPeakAmount || credit.totalAmount;
    let newHighestPeakDate = credit.highestPeakDate || credit.startDate;

    if (type === 'payment') {
      newRemaining = Math.max(0, newRemaining - parsedAmount);
    } else if (type === 'additional_credit') {
      newRemaining += parsedAmount;
      newTotal += parsedAmount;
      if (newRemaining > newHighestPeak) {
        newHighestPeak = newRemaining;
        newHighestPeakDate = txDate;
      }
    }

    // Determine status
    let status = credit.status;
    if (newRemaining === 0) {
      status = 'settled';
    } else {
      const today = new Date().toISOString().split('T')[0];
      if (credit.dueDate && credit.dueDate < today) {
        status = 'overdue';
      } else {
        status = 'active';
      }
    }

    await db.credits.update(creditId, {
      remainingAmount: newRemaining,
      totalAmount: newTotal,
      highestPeakAmount: newHighestPeak,
      highestPeakDate: newHighestPeakDate,
      status,
      updatedAt: new Date().toISOString()
    });

    return { tx: newTx, remainingAmount: newRemaining, status };
  });
}

export async function deleteCreditTransaction(txId) {
  return await db.transaction('rw', db.credits, db.creditTransactions, async () => {
    const tx = await db.creditTransactions.get(txId);
    if (!tx) return;

    const credit = await db.credits.get(tx.creditId);
    if (credit) {
      let newRemaining = credit.remainingAmount;
      if (tx.type === 'payment') {
        newRemaining += tx.amount;
      } else if (tx.type === 'additional_credit') {
        newRemaining = Math.max(0, newRemaining - tx.amount);
      }

      await db.credits.update(credit.id, {
        remainingAmount: newRemaining,
        status: newRemaining === 0 ? 'settled' : 'active',
        updatedAt: new Date().toISOString()
      });
    }

    await db.creditTransactions.delete(txId);
  });
}

// Calculate Summary & Metrics for Credit & Debt Hub
export function calculateCreditMetrics(credits = []) {
  let totalReceivable = 0; // Lena hai
  let totalPayable = 0;    // Dena hai
  let overdueCount = 0;
  let overdueAmount = 0;
  let dueThisWeekCount = 0;
  let dueThisWeekAmount = 0;

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const nextWeekDate = new Date(now);
  nextWeekDate.setDate(nextWeekDate.getDate() + 7);
  const nextWeekStr = nextWeekDate.toISOString().split('T')[0];

  let overallPeakAmount = 0;
  let overallPeakDate = '';
  let overallPeakEntity = '';

  credits.forEach(c => {
    const remaining = parseFloat(c.remainingAmount) || 0;
    if (c.type === 'receivable') {
      totalReceivable += remaining;
    } else {
      totalPayable += remaining;
    }

    if (c.status !== 'settled' && remaining > 0) {
      if (c.dueDate) {
        if (c.dueDate < todayStr) {
          overdueCount++;
          overdueAmount += remaining;
        } else if (c.dueDate >= todayStr && c.dueDate <= nextWeekStr) {
          dueThisWeekCount++;
          dueThisWeekAmount += remaining;
        }
      }
    }

    // Check peak
    const peak = parseFloat(c.highestPeakAmount || c.totalAmount) || 0;
    if (peak > overallPeakAmount) {
      overallPeakAmount = peak;
      overallPeakDate = c.highestPeakDate || c.startDate || '';
      overallPeakEntity = c.personName;
    }
  });

  const netBalance = totalReceivable - totalPayable;

  return {
    totalReceivable,
    totalPayable,
    netBalance,
    overdueCount,
    overdueAmount,
    dueThisWeekCount,
    dueThisWeekAmount,
    overallPeakAmount,
    overallPeakDate,
    overallPeakEntity
  };
}

// ==================== CATEGORY HIERARCHY HELPERS ====================

export async function getCategoryTree() {
  const allCategories = await db.categories.toArray();
  const map = new Map();
  const roots = [];

  allCategories.forEach(cat => {
    map.set(cat.id, { ...cat, children: [] });
  });

  allCategories.forEach(cat => {
    const node = map.get(cat.id);
    if (cat.parentId && map.has(cat.parentId)) {
      map.get(cat.parentId).children.push(node);
    } else {
      roots.push(node);
    }
  });

  const sortNodes = (nodes) => {
    nodes.sort((a, b) => (a.order || 99) - (b.order || 99) || a.name.localeCompare(b.name));
    nodes.forEach(n => sortNodes(n.children));
  };
  sortNodes(roots);

  return { roots, map };
}

export function findRootCategory(categoryId, categoryMap) {
  if (!categoryId) return null;
  let curr = categoryMap.get(categoryId);
  while (curr && curr.parentId) {
    const parent = categoryMap.get(curr.parentId);
    if (!parent) break;
    curr = parent;
  }
  return curr;
}

export async function addCategory({ name, parentId = null, icon = 'Tag', color = '#10b981' }) {
  const id = 'cat-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
  const newCat = {
    id,
    parentId,
    name: name.trim(),
    icon,
    color,
    order: Date.now()
  };
  await db.categories.add(newCat);
  return newCat;
}

export async function updateCategory(id, updates) {
  await db.categories.update(id, updates);
  return db.categories.get(id);
}

export async function deleteCategory(id, cascade = true) {
  await db.transaction('rw', db.categories, db.expenses, async () => {
    const targetCat = await db.categories.get(id);
    if (!targetCat) return;

    if (cascade) {
      const allCats = await db.categories.toArray();
      const getDescendantIds = (parentId) => {
        const directChildren = allCats.filter(c => c.parentId === parentId);
        let ids = directChildren.map(c => c.id);
        for (const child of directChildren) {
          ids = ids.concat(getDescendantIds(child.id));
        }
        return ids;
      };

      const descendantIds = [id, ...getDescendantIds(id)];
      await db.categories.bulkDelete(descendantIds);
      await db.expenses.where('categoryId').anyOf(descendantIds).modify({ categoryId: null, subcategoryId: null });
      await db.expenses.where('subcategoryId').anyOf(descendantIds).modify({ subcategoryId: null });
    } else {
      const parentId = targetCat.parentId;
      await db.categories.where('parentId').equals(id).modify({ parentId });
      await db.categories.delete(id);
      await db.expenses.where('categoryId').equals(id).modify({ categoryId: parentId });
      await db.expenses.where('subcategoryId').equals(id).modify({ subcategoryId: null });
    }
  });
}

export async function mergeCategories(sourceCategoryId, targetCategoryId) {
  if (sourceCategoryId === targetCategoryId) {
    throw new Error('Source and target categories cannot be the same');
  }

  return await db.transaction('rw', db.categories, db.expenses, async () => {
    const sourceCat = await db.categories.get(sourceCategoryId);
    const targetCat = await db.categories.get(targetCategoryId);

    if (!sourceCat || !targetCat) {
      throw new Error('One of the categories could not be found');
    }

    const updatedExpenses1 = await db.expenses
      .where('categoryId')
      .equals(sourceCategoryId)
      .modify({ categoryId: targetCategoryId, updatedAt: new Date().toISOString() });

    const updatedExpenses2 = await db.expenses
      .where('subcategoryId')
      .equals(sourceCategoryId)
      .modify({ subcategoryId: targetCategoryId, updatedAt: new Date().toISOString() });

    await db.categories
      .where('parentId')
      .equals(sourceCategoryId)
      .modify({ parentId: targetCategoryId });

    await db.categories.delete(sourceCategoryId);

    return {
      affectedExpenses: (updatedExpenses1 || 0) + (updatedExpenses2 || 0),
      sourceName: sourceCat.name,
      targetName: targetCat.name
    };
  });
}
