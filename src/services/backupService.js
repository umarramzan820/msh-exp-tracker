import { db } from '../db/db';

// Web Crypto PBKDF2 + AES-GCM 256 encryption helper
async function getKeyFromPassword(password, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypt plaintext string to JSON container { salt, iv, ciphertext }
export async function encryptData(text, password) {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await getKeyFromPassword(password, salt);

  const enc = new TextEncoder();
  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(text)
  );

  return {
    encrypted: true,
    version: '1.0',
    salt: Array.from(salt),
    iv: Array.from(iv),
    data: Array.from(new Uint8Array(ciphertextBuffer))
  };
}

// Decrypt JSON container with password
export async function decryptData(encryptedContainer, password) {
  const salt = new Uint8Array(encryptedContainer.salt);
  const iv = new Uint8Array(encryptedContainer.iv);
  const data = new Uint8Array(encryptedContainer.data);

  const key = await getKeyFromPassword(password, salt);
  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );

  const dec = new TextDecoder();
  return dec.decode(decryptedBuffer);
}

// Export Database as JSON (with optional password encryption)
export async function exportDatabaseToJson(password = null) {
  const categories = await db.categories.toArray();
  const expenses = await db.expenses.toArray();
  const budgets = await db.budgets.toArray();
  const settings = await db.settings.toArray();

  const backupPayload = {
    app: 'Expensio PWA',
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    stats: {
      categoryCount: categories.length,
      expenseCount: expenses.length
    },
    data: {
      categories,
      expenses,
      budgets,
      settings
    }
  };

  const jsonString = JSON.stringify(backupPayload, null, 2);

  if (password && password.trim().length > 0) {
    const encryptedObject = await encryptData(jsonString, password);
    const blob = new Blob([JSON.stringify(encryptedObject, null, 2)], { type: 'application/json' });
    triggerDownload(blob, `expensio-backup-encrypted-${getTimestampStr()}.json`);
    return { encrypted: true, records: expenses.length };
  } else {
    const blob = new Blob([jsonString], { type: 'application/json' });
    triggerDownload(blob, `expensio-backup-${getTimestampStr()}.json`);
    return { encrypted: false, records: expenses.length };
  }
}

// Export Expenses to standard CSV format
export async function exportExpensesToCsv() {
  const expenses = await db.expenses.toArray();
  const categories = await db.categories.toArray();
  const catMap = new Map(categories.map(c => [c.id, c.name]));

  const headers = [
    'ID',
    'Date',
    'Category',
    'Subcategory',
    'Amount',
    'PaymentMethod',
    'Description',
    'Tags',
    'Notes',
    'CreatedAt'
  ];

  const escapeCsv = (str) => {
    if (str === null || str === undefined) return '""';
    const s = String(str).replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = expenses.map(e => [
    escapeCsv(e.id),
    escapeCsv(e.date),
    escapeCsv(catMap.get(e.categoryId) || ''),
    escapeCsv(catMap.get(e.subcategoryId) || ''),
    escapeCsv(e.amount),
    escapeCsv(e.paymentMethod || 'cash'),
    escapeCsv(e.description || ''),
    escapeCsv(Array.isArray(e.tags) ? e.tags.join(', ') : (e.tags || '')),
    escapeCsv(e.notes || ''),
    escapeCsv(e.createdAt || '')
  ].join(','));

  const csvContent = [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, `expensio-expenses-${getTimestampStr()}.csv`);
}

// Restore JSON Backup with duplicate prevention & conflict resolution
export async function restoreBackupFromJson(jsonString, password = null, mode = 'merge') {
  let parsed;
  try {
    parsed = JSON.parse(jsonString);
  } catch (err) {
    throw new Error('Invalid JSON format: ' + err.message);
  }

  // Check if file is encrypted
  if (parsed.encrypted && parsed.salt && parsed.iv && parsed.data) {
    if (!password) {
      throw new Error('PASSWORD_REQUIRED');
    }
    try {
      const decryptedString = await decryptData(parsed, password);
      parsed = JSON.parse(decryptedString);
    } catch {
      throw new Error('INVALID_PASSWORD');
    }
  }

  if (!parsed.data || !Array.isArray(parsed.data.expenses) || !Array.isArray(parsed.data.categories)) {
    throw new Error('Invalid backup schema: Missing data.categories or data.expenses');
  }

  const { categories, expenses, budgets, settings } = parsed.data;

  let restoredExpenses = 0;
  let skippedDuplicates = 0;
  let restoredCategories = 0;

  await db.transaction('rw', [db.categories, db.expenses, db.budgets, db.settings], async () => {
    if (mode === 'replace') {
      // Clean replace
      await db.categories.clear();
      await db.expenses.clear();
      await db.budgets.clear();
      await db.settings.clear();

      await db.categories.bulkAdd(categories);
      await db.expenses.bulkAdd(expenses);
      if (budgets && budgets.length) await db.budgets.bulkAdd(budgets);
      if (settings && settings.length) await db.settings.bulkAdd(settings);

      restoredExpenses = expenses.length;
      restoredCategories = categories.length;
    } else {
      // Merge mode with duplicate prevention
      const existingCategories = await db.categories.toArray();
      const existingCatIds = new Set(existingCategories.map(c => c.id));

      for (const cat of categories) {
        if (!existingCatIds.has(cat.id)) {
          await db.categories.add(cat);
          restoredCategories++;
        } else {
          // Update properties
          await db.categories.update(cat.id, cat);
        }
      }

      const existingExpenses = await db.expenses.toArray();
      const existingExpIds = new Set(existingExpenses.map(e => e.id));

      for (const exp of expenses) {
        if (existingExpIds.has(exp.id)) {
          skippedDuplicates++;
        } else {
          await db.expenses.add(exp);
          restoredExpenses++;
        }
      }
    }
  });

  return {
    restoredCategories,
    restoredExpenses,
    skippedDuplicates,
    mode
  };
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function getTimestampStr() {
  const now = new Date();
  return now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
}
