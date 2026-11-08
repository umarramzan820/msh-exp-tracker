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
    version: '2.0',
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

// Generate the complete unified database JSON payload
export async function generateBackupPayload() {
  const categories = await db.categories.toArray();
  const expenses = await db.expenses.toArray();
  const budgets = await db.budgets.toArray();
  const settings = await db.settings.toArray();
  const credits = await db.credits.toArray();
  const creditTransactions = await db.creditTransactions.toArray();

  return {
    app: 'Expensio Unified Financial Suite',
    version: '2.0.0',
    exportDate: new Date().toISOString(),
    stats: {
      categoryCount: categories.length,
      expenseCount: expenses.length,
      creditCount: credits.length,
      creditTransactionCount: creditTransactions.length
    },
    data: {
      categories,
      expenses,
      budgets,
      settings,
      credits,
      creditTransactions
    }
  };
}

// Export Database as JSON (with optional password encryption)
export async function exportDatabaseToJson(password = null) {
  const backupPayload = await generateBackupPayload();
  const jsonString = JSON.stringify(backupPayload, null, 2);
  const expensesCount = backupPayload.data.expenses.length;
  const creditsCount = backupPayload.data.credits.length;

  if (password && password.trim().length > 0) {
    const encryptedObject = await encryptData(jsonString, password);
    const blob = new Blob([JSON.stringify(encryptedObject, null, 2)], { type: 'application/json' });
    triggerDownload(blob, `expensio-suite-backup-encrypted-${getTimestampStr()}.json`);
    return { encrypted: true, records: expensesCount + creditsCount };
  } else {
    const blob = new Blob([jsonString], { type: 'application/json' });
    triggerDownload(blob, `expensio-suite-backup-${getTimestampStr()}.json`);
    return { encrypted: false, records: expensesCount + creditsCount };
  }
}

// Send Backup to Email (triggers Web Share API or prepares mailto + file download)
export async function sendBackupToEmail(password = null, recipientEmail = '') {
  const backupPayload = await generateBackupPayload();
  const jsonString = JSON.stringify(backupPayload, null, 2);
  const filename = `expensio-backup-${getTimestampStr()}.json`;

  let finalContent = jsonString;
  let isEncrypted = false;

  if (password && password.trim().length > 0) {
    const encryptedObject = await encryptData(jsonString, password);
    finalContent = JSON.stringify(encryptedObject, null, 2);
    isEncrypted = true;
  }

  const blob = new Blob([finalContent], { type: 'application/json' });
  const file = new File([blob], filename, { type: 'application/json' });

  // 1. Try native Web Share API with files (supported on Mobile Chrome/Safari/Edge)
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        title: 'Expensio Unified Financial Suite Backup',
        text: `Expensio Database Backup created on ${new Date().toLocaleDateString()}. Contains ${backupPayload.stats.expenseCount} expenses and ${backupPayload.stats.creditCount} credit/debt records.`,
        files: [file]
      });
      return { success: true, method: 'share', filename };
    } catch (err) {
      if (err.name === 'AbortError') {
        return { success: false, cancelled: true };
      }
    }
  }

  // 2. Fallback: Download file automatically and open email client via mailto:
  triggerDownload(blob, filename);

  const subject = encodeURIComponent(`Expensio Financial Suite Backup (${new Date().toLocaleDateString()})`);
  const body = encodeURIComponent(
    `Hello,\n\nYour Expensio database backup file "${filename}" has been prepared and downloaded to your device.\n\n` +
    `Summary:\n- Total Expenses: ${backupPayload.stats.expenseCount}\n- Total Credit & Debt Accounts: ${backupPayload.stats.creditCount}\n- Export Date: ${new Date().toLocaleString()}\n- Encrypted: ${isEncrypted ? 'Yes (AES-GCM 256)' : 'No'}\n\n` +
    `Please attach the downloaded file "${filename}" to this email for safe keeping.\n\nExpensio Unified Financial Suite`
  );

  const mailtoUrl = `mailto:${recipientEmail || ''}?subject=${subject}&body=${body}`;
  window.location.href = mailtoUrl;

  return { success: true, method: 'mailto', filename };
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

  const { categories, expenses, budgets, settings, credits = [], creditTransactions = [] } = parsed.data;

  let restoredExpenses = 0;
  let skippedDuplicates = 0;
  let restoredCategories = 0;
  let restoredCredits = 0;

  const tablesToLock = [db.categories, db.expenses, db.budgets, db.settings, db.credits, db.creditTransactions];

  await db.transaction('rw', tablesToLock, async () => {
    if (mode === 'replace') {
      // Clean replace all tables
      await db.categories.clear();
      await db.expenses.clear();
      await db.budgets.clear();
      await db.settings.clear();
      await db.credits.clear();
      await db.creditTransactions.clear();

      await db.categories.bulkAdd(categories);
      await db.expenses.bulkAdd(expenses);
      if (budgets && budgets.length) await db.budgets.bulkAdd(budgets);
      if (settings && settings.length) await db.settings.bulkAdd(settings);
      if (credits && credits.length) await db.credits.bulkAdd(credits);
      if (creditTransactions && creditTransactions.length) await db.creditTransactions.bulkAdd(creditTransactions);

      restoredExpenses = expenses.length;
      restoredCategories = categories.length;
      restoredCredits = credits.length;
    } else {
      // Merge mode with duplicate prevention
      const existingCategories = await db.categories.toArray();
      const existingCatIds = new Set(existingCategories.map(c => c.id));

      for (const cat of categories) {
        if (!existingCatIds.has(cat.id)) {
          await db.categories.add(cat);
          restoredCategories++;
        } else {
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

      const existingCredits = await db.credits.toArray();
      const existingCredIds = new Set(existingCredits.map(c => c.id));

      for (const cred of credits) {
        if (!existingCredIds.has(cred.id)) {
          await db.credits.add(cred);
          restoredCredits++;
        } else {
          await db.credits.update(cred.id, cred);
        }
      }

      const existingTx = await db.creditTransactions.toArray();
      const existingTxIds = new Set(existingTx.map(t => t.id));

      for (const tx of creditTransactions) {
        if (!existingTxIds.has(tx.id)) {
          await db.creditTransactions.add(tx);
        }
      }
    }
  });

  return {
    restoredCategories,
    restoredExpenses,
    restoredCredits,
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
