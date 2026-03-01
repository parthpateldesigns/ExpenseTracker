/* ============================================
   LocalStorage persistence — theme only
   (All financial data now lives in Firebase Firestore)
   ============================================ */

const THEME_KEY = 'balance_theme';

export function getTheme() {
  return localStorage.getItem(THEME_KEY) || 'dark';
}

export function saveTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
}
