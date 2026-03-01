/* ============================================
   LocalStorage persistence for Balance
   ============================================ */

const STORAGE_KEYS = {
  ACCOUNTS: 'balance_accounts',
  TRANSACTIONS: 'balance_transactions',
  CATEGORIES: 'balance_categories',
  THEME: 'balance_theme',
};

const DEFAULT_CATEGORIES = [
  'Rent',
  'Utilities',
  'Credit Card',
  'Groceries',
  'Quick Commerce',
  'Eating Out',
  'Fitness',
  'Shopping',
  'Home Essentials',
  'Miscellaneous',
];

function getItem(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setItem(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Storage write failed:', e);
  }
}

// ---- Accounts ----

const DEFAULT_ACCOUNTS = [
  { id: 'acc-sbi', name: 'SBI', openingBalance: 3633.74, minBalanceAlert: 0, createdAt: '2026-03-01T00:00:00.000Z' },
  { id: 'acc-hdfc', name: 'HDFC', openingBalance: 118, minBalanceAlert: 0, createdAt: '2026-03-01T00:00:00.001Z' },
  { id: 'acc-fi', name: 'Fi Money', openingBalance: 4794.14, minBalanceAlert: 0, createdAt: '2026-03-01T00:00:00.002Z' },
  { id: 'acc-federal', name: 'Federal', openingBalance: 57.18, minBalanceAlert: 0, createdAt: '2026-03-01T00:00:00.003Z' },
];

export function getAccounts() {
  const stored = getItem(STORAGE_KEYS.ACCOUNTS, null);
  if (stored === null) {
    // First run — seed default accounts
    setItem(STORAGE_KEYS.ACCOUNTS, DEFAULT_ACCOUNTS);
    return [...DEFAULT_ACCOUNTS];
  }
  return stored;
}

export function saveAccounts(accounts) {
  setItem(STORAGE_KEYS.ACCOUNTS, accounts);
}

// ---- Transactions ----

export function getTransactions() {
  return getItem(STORAGE_KEYS.TRANSACTIONS, []);
}

export function saveTransactions(txns) {
  setItem(STORAGE_KEYS.TRANSACTIONS, txns);
}

// ---- Categories ----

export function getCategories() {
  const stored = getItem(STORAGE_KEYS.CATEGORIES, null);
  if (!stored) {
    setItem(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES);
    return [...DEFAULT_CATEGORIES];
  }
  return stored;
}

export function saveCategories(categories) {
  setItem(STORAGE_KEYS.CATEGORIES, categories);
}

// ---- Theme ----

export function getTheme() {
  return localStorage.getItem(STORAGE_KEYS.THEME) || 'dark';
}

export function saveTheme(theme) {
  localStorage.setItem(STORAGE_KEYS.THEME, theme);
}
