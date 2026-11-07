export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham' },
  { code: 'SAR', symbol: 'SAR', name: 'Saudi Riyal' }
];

export function formatCurrency(amount, currencyCode = 'USD') {
  const curr = CURRENCIES.find(c => c.code === currencyCode) || CURRENCIES[0];
  const num = typeof amount === 'number' ? amount : parseFloat(amount) || 0;

  // Format with commas and 2 decimals (except JPY)
  const decimals = curr.code === 'JPY' ? 0 : 2;
  const formattedNumber = num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });

  return `${curr.symbol} ${formattedNumber}`;
}

export function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  
  // Format as friendly date e.g. "Nov 8, 2026"
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}

export function formatRelativeDate(dateString) {
  if (!dateString) return '';
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  if (dateString === today) return 'Today';
  if (dateString === yesterday) return 'Yesterday';

  return formatDate(dateString);
}

export const PAYMENT_METHODS = [
  { id: 'cash', label: 'Cash', icon: 'Banknote', color: 'emerald' },
  { id: 'credit_card', label: 'Credit Card', icon: 'CreditCard', color: 'blue' },
  { id: 'debit_card', label: 'Debit Card', icon: 'CreditCard', color: 'indigo' },
  { id: 'bank_transfer', label: 'Bank Transfer', icon: 'Building2', color: 'purple' },
  { id: 'digital_wallet', label: 'Digital Wallet', icon: 'Smartphone', color: 'amber' }
];

export function getPaymentMethodInfo(id) {
  return PAYMENT_METHODS.find(m => m.id === id) || PAYMENT_METHODS[0];
}

// Clean and normalize tags: converts `#urgent, #cash` into clean array `['urgent', 'cash']`
export function normalizeTags(tags) {
  if (Array.isArray(tags)) {
    return tags.map(t => t.replace(/^#+/, '').trim()).filter(Boolean);
  }
  if (typeof tags === 'string') {
    return tags
      .split(/[\s,]+/)
      .map(t => t.replace(/^#+/, '').trim())
      .filter(Boolean);
  }
  return [];
}
