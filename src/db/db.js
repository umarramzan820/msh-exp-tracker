import Dexie from 'dexie';

export class ExpenseTrackerDatabase extends Dexie {
  constructor() {
    super('ExpensioDB');

    this.version(1).stores({
      categories: 'id, parentId, name, order',
      expenses: 'id, amount, date, categoryId, subcategoryId, paymentMethod, createdAt, updatedAt, synced',
      budgets: 'id, categoryId, period',
      settings: 'key'
    });
  }
}

export const db = new ExpenseTrackerDatabase();

// Default seed categories (Hierarchical: Parent -> Child -> Sub-child)
export const DEFAULT_CATEGORIES = [
  // Grocery hierarchy
  { id: 'cat-grocery', parentId: null, name: 'Grocery', icon: 'ShoppingCart', color: '#10b981', order: 1 },
  { id: 'sub-daal', parentId: 'cat-grocery', name: 'Daal & Pulses', icon: 'Package', color: '#34d399', order: 1 },
  { id: 'sub-daal-channa', parentId: 'sub-daal', name: 'Daal Channa', icon: 'Tag', color: '#6ee7b7', order: 1 },
  { id: 'sub-daal-moong', parentId: 'sub-daal', name: 'Daal Moong', icon: 'Tag', color: '#6ee7b7', order: 2 },
  { id: 'sub-daal-masoor', parentId: 'sub-daal', name: 'Daal Masoor', icon: 'Tag', color: '#6ee7b7', order: 3 },
  { id: 'sub-fruits-veg', parentId: 'cat-grocery', name: 'Fruits & Veggies', icon: 'Apple', color: '#34d399', order: 2 },
  { id: 'sub-dairy', parentId: 'cat-grocery', name: 'Dairy & Poultry', icon: 'Milk', color: '#34d399', order: 3 },
  { id: 'sub-spices', parentId: 'cat-grocery', name: 'Spices & Pantry', icon: 'Box', color: '#34d399', order: 4 },

  // Housing hierarchy
  { id: 'cat-housing', parentId: null, name: 'Housing & Rent', icon: 'Home', color: '#3b82f6', order: 2 },
  { id: 'sub-rent', parentId: 'cat-housing', name: 'Apartment Rent', icon: 'Key', color: '#60a5fa', order: 1 },
  { id: 'sub-electricity', parentId: 'cat-housing', name: 'Electricity Bill', icon: 'Zap', color: '#60a5fa', order: 2 },
  { id: 'sub-gas-water', parentId: 'cat-housing', name: 'Gas & Water', icon: 'Droplet', color: '#60a5fa', order: 3 },
  { id: 'sub-internet', parentId: 'cat-housing', name: 'WiFi & Internet', icon: 'Wifi', color: '#60a5fa', order: 4 },

  // Transportation hierarchy
  { id: 'cat-transport', parentId: null, name: 'Transportation', icon: 'Car', color: '#f59e0b', order: 3 },
  { id: 'sub-fuel', parentId: 'cat-transport', name: 'Fuel / Petrol', icon: 'Fuel', color: '#fbbf24', order: 1 },
  { id: 'sub-rideshare', parentId: 'cat-transport', name: 'Ride Sharing (Uber/Careem)', icon: 'Navigation', color: '#fbbf24', order: 2 },
  { id: 'sub-transit', parentId: 'cat-transport', name: 'Metro / Transit Bus', icon: 'Bus', color: '#fbbf24', order: 3 },
  { id: 'sub-maintenance', parentId: 'cat-transport', name: 'Car Service & Repair', icon: 'Wrench', color: '#fbbf24', order: 4 },

  // Food & Dining
  { id: 'cat-dining', parentId: null, name: 'Dining & Food', icon: 'Utensils', color: '#ec4899', order: 4 },
  { id: 'sub-restaurants', parentId: 'cat-dining', name: 'Family Restaurants', icon: 'UtensilsCrossed', color: '#f472b6', order: 1 },
  { id: 'sub-cafes', parentId: 'cat-dining', name: 'Cafes & Specialty Coffee', icon: 'Coffee', color: '#f472b6', order: 2 },
  { id: 'sub-fastfood', parentId: 'cat-dining', name: 'Fast Food & Snacks', icon: 'Pizza', color: '#f472b6', order: 3 },

  // Healthcare
  { id: 'cat-healthcare', parentId: null, name: 'Healthcare', icon: 'HeartPulse', color: '#ef4444', order: 5 },
  { id: 'sub-pharmacy', parentId: 'cat-healthcare', name: 'Medicines & Pharmacy', icon: 'Pill', color: '#f87171', order: 1 },
  { id: 'sub-doctor', parentId: 'cat-healthcare', name: 'Doctor Consultation', icon: 'Stethoscope', color: '#f87171', order: 2 },
  { id: 'sub-insurance', parentId: 'cat-healthcare', name: 'Health Insurance', icon: 'ShieldPlus', color: '#f87171', order: 3 },

  // Entertainment
  { id: 'cat-entertainment', parentId: null, name: 'Entertainment', icon: 'Gamepad2', color: '#8b5cf6', order: 6 },
  { id: 'sub-subscriptions', parentId: 'cat-entertainment', name: 'Subscriptions (Netflix/Spotify)', icon: 'Tv', color: '#a78bfa', order: 1 },
  { id: 'sub-movies', parentId: 'cat-entertainment', name: 'Cinema & Outings', icon: 'Film', color: '#a78bfa', order: 2 },

  // Shopping & Personal
  { id: 'cat-shopping', parentId: null, name: 'Shopping & Personal', icon: 'ShoppingBag', color: '#06b6d4', order: 7 },
  { id: 'sub-clothing', parentId: 'cat-shopping', name: 'Apparel & Shoes', icon: 'Shirt', color: '#22d3ee', order: 1 },
  { id: 'sub-electronics', parentId: 'cat-shopping', name: 'Gadgets & Accessories', icon: 'Smartphone', color: '#22d3ee', order: 2 },
  { id: 'sub-salon', parentId: 'cat-shopping', name: 'Grooming & Salon', icon: 'Scissors', color: '#22d3ee', order: 3 },

  // Education & Growth
  { id: 'cat-education', parentId: null, name: 'Education & Growth', icon: 'GraduationCap', color: '#14b8a6', order: 8 },
  { id: 'sub-courses', parentId: 'cat-education', name: 'Online Courses & Certs', icon: 'BookOpen', color: '#2dd4bf', order: 1 },
  { id: 'sub-books', parentId: 'cat-education', name: 'Books & Reference', icon: 'Bookmark', color: '#2dd4bf', order: 2 }
];

// Default sample expenses for immediate rich analytics demonstration
export function generateSampleExpenses() {
  const now = new Date();
  const formatIsoDate = (d) => d.toISOString().split('T')[0];

  const daysAgo = (days) => {
    const d = new Date(now);
    d.setDate(d.getDate() - days);
    return formatIsoDate(d);
  };

  return [
    // Today
    {
      id: 'exp-01',
      amount: 45.50,
      date: daysAgo(0),
      categoryId: 'cat-grocery',
      subcategoryId: 'sub-daal-channa',
      description: 'Organic Daal Channa 2kg & Spices',
      tags: ['grocery', 'cash', 'daal'],
      paymentMethod: 'cash',
      notes: 'Purchased from local bulk mart',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: 0
    },
    {
      id: 'exp-02',
      amount: 14.20,
      date: daysAgo(0),
      categoryId: 'cat-dining',
      subcategoryId: 'sub-cafes',
      description: 'Morning Iced Oat Latte',
      tags: ['coffee', 'urgent'],
      paymentMethod: 'digital_wallet',
      notes: 'Pre-meeting coffee',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: 0
    },
    // Yesterday
    {
      id: 'exp-03',
      amount: 68.00,
      date: daysAgo(1),
      categoryId: 'cat-transport',
      subcategoryId: 'sub-fuel',
      description: 'Full Tank Premium Gasoline',
      tags: ['car', 'fuel', 'weekly'],
      paymentMethod: 'credit_card',
      notes: 'Shell gas station',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: 0
    },
    {
      id: 'exp-04',
      amount: 32.50,
      date: daysAgo(1),
      categoryId: 'cat-grocery',
      subcategoryId: 'sub-daal-moong',
      description: 'Daal Moong Wash & Basmati Rice',
      tags: ['grocery', 'daal'],
      paymentMethod: 'debit_card',
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: 0
    },
    // This week
    {
      id: 'exp-05',
      amount: 120.00,
      date: daysAgo(3),
      categoryId: 'cat-dining',
      subcategoryId: 'sub-restaurants',
      description: 'Weekend Family Dinner at Olive Bistro',
      tags: ['family', 'dining', 'weekend'],
      paymentMethod: 'credit_card',
      notes: 'Four persons dinner',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: 0
    },
    {
      id: 'exp-06',
      amount: 28.00,
      date: daysAgo(4),
      categoryId: 'cat-healthcare',
      subcategoryId: 'sub-pharmacy',
      description: 'Multivitamins & Omega-3 supplement',
      tags: ['health', 'cash'],
      paymentMethod: 'cash',
      notes: 'Monthly prescription',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: 0
    },
    {
      id: 'exp-07',
      amount: 85.00,
      date: daysAgo(5),
      categoryId: 'cat-housing',
      subcategoryId: 'sub-electricity',
      description: 'Monthly Electric Utility Bill',
      tags: ['monthly', 'utility', 'urgent'],
      paymentMethod: 'bank_transfer',
      notes: 'Paid via online banking',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: 0
    },
    // Last week
    {
      id: 'exp-08',
      amount: 15.99,
      date: daysAgo(8),
      categoryId: 'cat-entertainment',
      subcategoryId: 'sub-subscriptions',
      description: 'Netflix 4K Ultra HD Plan',
      tags: ['recurring', 'monthly'],
      paymentMethod: 'credit_card',
      notes: 'Monthly recurring charge',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: 0
    },
    {
      id: 'exp-09',
      amount: 72.40,
      date: daysAgo(9),
      categoryId: 'cat-transport',
      subcategoryId: 'sub-rideshare',
      description: 'Airport Transit Rideshare',
      tags: ['travel', 'urgent'],
      paymentMethod: 'digital_wallet',
      notes: 'Late night arrival ride',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: 0
    },
    {
      id: 'exp-10',
      amount: 54.00,
      date: daysAgo(10),
      categoryId: 'cat-grocery',
      subcategoryId: 'sub-dairy',
      description: 'Fresh Milk, Cheese & Greek Yogurt',
      tags: ['grocery', 'dairy'],
      paymentMethod: 'debit_card',
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: 0
    },
    {
      id: 'exp-11',
      amount: 19.50,
      date: daysAgo(12),
      categoryId: 'cat-grocery',
      subcategoryId: 'sub-daal-masoor',
      description: 'Daal Masoor 3kg packet',
      tags: ['grocery', 'daal'],
      paymentMethod: 'cash',
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: 0
    },
    // Earlier this month
    {
      id: 'exp-12',
      amount: 49.00,
      date: daysAgo(15),
      categoryId: 'cat-housing',
      subcategoryId: 'sub-internet',
      description: 'Fiber Optic 500Mbps Internet',
      tags: ['monthly', 'utility'],
      paymentMethod: 'bank_transfer',
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: 0
    },
    {
      id: 'exp-13',
      amount: 110.00,
      date: daysAgo(18),
      categoryId: 'cat-shopping',
      subcategoryId: 'sub-clothing',
      description: 'Winter Jacket & Cotton Shirts',
      tags: ['shopping', 'clothes'],
      paymentMethod: 'credit_card',
      notes: 'Seasonal clearance sale',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: 0
    },
    {
      id: 'exp-14',
      amount: 35.00,
      date: daysAgo(20),
      categoryId: 'cat-education',
      subcategoryId: 'sub-books',
      description: 'System Architecture Design Book',
      tags: ['study', 'tax-deductible'],
      paymentMethod: 'credit_card',
      notes: 'E-book and paperback',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: 0
    },
    // Last month records for Month-over-Month (MoM) comparison
    {
      id: 'exp-15',
      amount: 950.00,
      date: daysAgo(35),
      categoryId: 'cat-housing',
      subcategoryId: 'sub-rent',
      description: 'Monthly Apartment Rent Payment',
      tags: ['rent', 'monthly', 'urgent'],
      paymentMethod: 'bank_transfer',
      notes: 'Prior month rent',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: 0
    },
    {
      id: 'exp-16',
      amount: 95.00,
      date: daysAgo(36),
      categoryId: 'cat-transport',
      subcategoryId: 'sub-maintenance',
      description: 'Brake pads inspection & tire rotation',
      tags: ['car', 'maintenance'],
      paymentMethod: 'credit_card',
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: 0
    },
    {
      id: 'exp-17',
      amount: 88.50,
      date: daysAgo(38),
      categoryId: 'cat-grocery',
      subcategoryId: 'sub-fruits-veg',
      description: 'Bulk Fresh Organic Vegetables',
      tags: ['grocery', 'cash'],
      paymentMethod: 'cash',
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: 0
    },
    {
      id: 'exp-18',
      amount: 75.00,
      date: daysAgo(40),
      categoryId: 'cat-dining',
      subcategoryId: 'sub-restaurants',
      description: 'Sushi Night Celebration',
      tags: ['dining', 'weekend'],
      paymentMethod: 'credit_card',
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: 0
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

  // Set default settings if not exists
  const currencySetting = await db.settings.get('currency');
  if (!currencySetting) {
    await db.settings.put({ key: 'currency', value: 'USD' });
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

// Category Hierarchy Helper Functions
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

  // Sort by order or name
  const sortNodes = (nodes) => {
    nodes.sort((a, b) => (a.order || 99) - (b.order || 99) || a.name.localeCompare(b.name));
    nodes.forEach(n => sortNodes(n.children));
  };
  sortNodes(roots);

  return { roots, map };
}

// Build category breadcrumb path (e.g. "Grocery > Daal & Pulses > Daal Channa")
export async function getCategoryPath(categoryId) {
  if (!categoryId) return '';
  const allCategories = await db.categories.toArray();
  const map = new Map(allCategories.map(c => [c.id, c]));

  const path = [];
  let curr = map.get(categoryId);
  while (curr) {
    path.unshift(curr.name);
    curr = curr.parentId ? map.get(curr.parentId) : null;
  }
  return path.join(' > ');
}

// Find top-level root category for any category or subcategory id
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

// Dynamic Category Operations: Add, Edit, Delete, Merge
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

// Safe Delete: Delete category and either delete child items or reparent them to grandparent
export async function deleteCategory(id, cascade = true) {
  await db.transaction('rw', db.categories, db.expenses, async () => {
    const targetCat = await db.categories.get(id);
    if (!targetCat) return;

    if (cascade) {
      // Find all descendants recursively
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

      // Delete all categories
      await db.categories.bulkDelete(descendantIds);

      // Reassign or un-link expenses
      await db.expenses.where('categoryId').anyOf(descendantIds).modify({ categoryId: null, subcategoryId: null });
      await db.expenses.where('subcategoryId').anyOf(descendantIds).modify({ subcategoryId: null });
    } else {
      // Reparent children to this category's parent
      const parentId = targetCat.parentId;
      await db.categories.where('parentId').equals(id).modify({ parentId });
      await db.categories.delete(id);
      await db.expenses.where('categoryId').equals(id).modify({ categoryId: parentId });
      await db.expenses.where('subcategoryId').equals(id).modify({ subcategoryId: null });
    }
  });
}

// Merge category A into category B (reassigning all expenses and child categories seamlessly)
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

    // 1. Reassign expenses where categoryId is source
    const updatedExpenses1 = await db.expenses
      .where('categoryId')
      .equals(sourceCategoryId)
      .modify({ categoryId: targetCategoryId, updatedAt: new Date().toISOString() });

    // 2. Reassign expenses where subcategoryId is source
    const updatedExpenses2 = await db.expenses
      .where('subcategoryId')
      .equals(sourceCategoryId)
      .modify({ subcategoryId: targetCategoryId, updatedAt: new Date().toISOString() });

    // 3. Reassign child categories belonging to source to target
    await db.categories
      .where('parentId')
      .equals(sourceCategoryId)
      .modify({ parentId: targetCategoryId });

    // 4. Delete the source category
    await db.categories.delete(sourceCategoryId);

    return {
      affectedExpenses: (updatedExpenses1 || 0) + (updatedExpenses2 || 0),
      sourceName: sourceCat.name,
      targetName: targetCat.name
    };
  });
}
