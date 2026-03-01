import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { v4 as uuid } from 'uuid';
import {
    getAccounts, saveAccounts,
    getTransactions, saveTransactions,
    getCategories, saveCategories,
    getTheme, saveTheme,
} from '../utils/storage';
import {
    getCurrentMonthYear,
    filterTransactionsByMonth,
    calculateTotals,
} from '../utils/helpers';

const AppContext = createContext(null);

export function AppProvider({ children }) {
    const [accounts, setAccounts] = useState(getAccounts);
    const [transactions, setTransactions] = useState(getTransactions);
    const [categories, setCategoriesState] = useState(getCategories);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthYear);
    const [toast, setToast] = useState(null);
    const [theme, setTheme] = useState(getTheme);

    // Sync theme attribute to <html>
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    const toggleTheme = useCallback(() => {
        setTheme((prev) => {
            const next = prev === 'dark' ? 'light' : 'dark';
            saveTheme(next);
            return next;
        });
    }, []);

    // ---- Toast ----
    const showToast = useCallback((message) => {
        setToast(message);
        setTimeout(() => setToast(null), 2200);
    }, []);

    // ---- Accounts ----
    const addAccount = useCallback((name, openingBalance) => {
        setAccounts((prev) => {
            const updated = [...prev, {
                id: uuid(),
                name,
                openingBalance: Number(openingBalance),
                minBalanceAlert: 0,
                createdAt: new Date().toISOString(),
            }];
            saveAccounts(updated);
            return updated;
        });
        showToast(`${name} added`);
    }, [showToast]);

    const updateAccount = useCallback((id, updates) => {
        setAccounts((prev) => {
            const updated = prev.map((a) => (a.id === id ? { ...a, ...updates } : a));
            saveAccounts(updated);
            return updated;
        });
    }, []);

    const deleteAccount = useCallback((id) => {
        setAccounts((prev) => {
            const updated = prev.filter((a) => a.id !== id);
            saveAccounts(updated);
            return updated;
        });
        setTransactions((prev) => {
            const updated = prev.filter((t) => t.accountId !== id && t.toAccountId !== id);
            saveTransactions(updated);
            return updated;
        });
        showToast('Account deleted');
    }, [showToast]);

    // ---- Transactions ----
    const addTransaction = useCallback((txn) => {
        const newTxn = { ...txn, id: uuid(), createdAt: new Date().toISOString() };
        setTransactions((prev) => {
            const updated = [newTxn, ...prev];
            saveTransactions(updated);
            return updated;
        });
        showToast(txn.type === 'transfer' ? 'Transfer recorded' : 'Transaction added');
    }, [showToast]);

    const deleteTransaction = useCallback((id) => {
        setTransactions((prev) => {
            const updated = prev.filter((t) => t.id !== id);
            saveTransactions(updated);
            return updated;
        });
        showToast('Transaction deleted');
    }, [showToast]);

    // ---- Categories ----
    const addCategory = useCallback((name) => {
        setCategoriesState((prev) => {
            if (prev.includes(name)) return prev;
            const updated = [...prev, name];
            saveCategories(updated);
            return updated;
        });
    }, []);

    // ---- Computed: account balances ----
    const accountBalances = useMemo(() => {
        const balances = {};
        for (const acc of accounts) {
            balances[acc.id] = acc.openingBalance;
        }
        for (const txn of transactions) {
            if (txn.type === 'transfer') {
                if (balances[txn.accountId] !== undefined) {
                    balances[txn.accountId] -= txn.amount;
                }
                if (balances[txn.toAccountId] !== undefined) {
                    balances[txn.toAccountId] += txn.amount;
                }
            } else {
                if (balances[txn.accountId] === undefined) continue;
                if (txn.type === 'income') {
                    balances[txn.accountId] += txn.amount;
                } else {
                    balances[txn.accountId] -= txn.amount;
                }
            }
        }
        return balances;
    }, [accounts, transactions]);

    // ---- Computed: monthly totals per account ----
    const monthlyAccountTotals = useMemo(() => {
        const { month, year } = selectedMonth;
        const monthTxns = filterTransactionsByMonth(transactions, month, year);
        const totals = {};

        for (const acc of accounts) {
            totals[acc.id] = { income: 0, expense: 0, transferIn: 0, transferOut: 0 };
        }

        for (const txn of monthTxns) {
            if (txn.type === 'transfer') {
                if (totals[txn.accountId]) totals[txn.accountId].transferOut += txn.amount;
                if (totals[txn.toAccountId]) totals[txn.toAccountId].transferIn += txn.amount;
            } else {
                if (!totals[txn.accountId]) continue;
                if (txn.type === 'income') {
                    totals[txn.accountId].income += txn.amount;
                } else {
                    totals[txn.accountId].expense += txn.amount;
                }
            }
        }

        return totals;
    }, [accounts, transactions, selectedMonth]);

    // ---- Computed: global totals for selected month ----
    const globalTotals = useMemo(() => {
        const { month, year } = selectedMonth;
        const monthTxns = filterTransactionsByMonth(transactions, month, year);
        const { income, expense, net } = calculateTotals(monthTxns);
        const totalBalance = Object.values(accountBalances).reduce((s, b) => s + b, 0);
        return { totalBalance, income, expense, net };
    }, [transactions, accountBalances, selectedMonth]);

    const value = useMemo(() => ({
        accounts,
        transactions,
        categories,
        activeTab,
        selectedMonth,
        toast,
        theme,
        accountBalances,
        monthlyAccountTotals,
        globalTotals,
        setActiveTab,
        setSelectedMonth,
        addAccount,
        updateAccount,
        deleteAccount,
        addTransaction,
        deleteTransaction,
        addCategory,
        showToast,
        toggleTheme,
    }), [
        accounts, transactions, categories, activeTab, selectedMonth, toast, theme,
        accountBalances, monthlyAccountTotals, globalTotals,
        addAccount, updateAccount, deleteAccount, addTransaction, deleteTransaction,
        addCategory, showToast, toggleTheme,
    ]);

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error('useApp must be inside AppProvider');
    return ctx;
}
