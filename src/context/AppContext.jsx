import {
    createContext, useContext, useState,
    useCallback, useMemo, useEffect,
} from 'react';
import {
    collection, doc,
    onSnapshot, addDoc, updateDoc, deleteDoc, setDoc, getDoc,
    query, orderBy, serverTimestamp, writeBatch,
} from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { db, auth } from '../firebase';
import { getCurrentMonthYear, filterTransactionsByMonth, calculateTotals } from '../utils/helpers';
import { getTheme, saveTheme } from '../utils/storage';

// ─── PIN helper ───────────────────────────────────────────────────────────────
async function hashPin(pin) {
    const data = new TextEncoder().encode(pin + '-balance-2024');
    const buffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(buffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
}

// ─── Default data seeded on first login ──────────────────────────────────────
const DEFAULT_ACCOUNTS = [
    { name: 'SBI', openingBalance: 3633.74, minBalanceAlert: 0 },
    { name: 'HDFC', openingBalance: 118, minBalanceAlert: 0 },
    { name: 'Fi Money', openingBalance: 4794.14, minBalanceAlert: 0 },
    { name: 'Federal', openingBalance: 57.18, minBalanceAlert: 0 },
];

const DEFAULT_CATEGORIES = [
    'Rent', 'Utilities', 'Credit Card', 'Groceries',
    'Quick Commerce', 'Eating Out', 'Fitness',
    'Shopping', 'Home Essentials', 'Miscellaneous',
];

const AppContext = createContext(null);

// ─── Firestore path helpers ───────────────────────────────────────────────────
const accountsCol = (uid) => collection(db, 'users', uid, 'accounts');
const transactionsCol = (uid) => collection(db, 'users', uid, 'transactions');
const metaDoc = (uid) => doc(db, 'users', uid, 'meta', 'prefs');

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AppProvider({ children }) {
    // Auth
    const [user, setUser] = useState(undefined);  // undefined = checking, null = logged out
    // PIN
    const [hasPin, setHasPin] = useState(null);    // null = not yet checked
    const [pinLocked, setPinLocked] = useState(true);
    const [pinChecked, setPinChecked] = useState(false);
    // Data
    const [accounts, setAccounts] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
    // UI
    const [activeTab, setActiveTab] = useState('dashboard');
    const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthYear);
    const [toast, setToast] = useState(null);
    const [theme, setTheme] = useState(getTheme);
    const [loading, setLoading] = useState(true);

    // ── Theme ────────────────────────────────────────────────────────────────
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

    // ── Auth state + Firestore listeners ─────────────────────────────────────
    useEffect(() => {
        const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);

            if (!firebaseUser) {
                setAccounts([]);
                setTransactions([]);
                setCategories(DEFAULT_CATEGORIES);
                setHasPin(null);
                setPinLocked(true);
                setPinChecked(false);
                setLoading(false);
                return;
            }

            const uid = firebaseUser.uid;

            // Seed default accounts if this is a brand-new user
            const prefsRef = metaDoc(uid);
            const prefsSnap = await getDoc(prefsRef);
            if (!prefsSnap.exists()) {
                // First sign-in — seed accounts + prefs
                const batch = writeBatch(db);
                for (const acc of DEFAULT_ACCOUNTS) {
                    const ref = doc(accountsCol(uid));
                    batch.set(ref, { ...acc, createdAt: serverTimestamp() });
                }
                batch.set(prefsRef, { categories: DEFAULT_CATEGORIES });
                await batch.commit();
                // No PIN yet — new user
                setHasPin(false);
                setPinLocked(false);
            } else {
                // Returning user — check if PIN is set
                const pinHash = prefsSnap.data().pinHash || null;
                const sessionUnlocked = sessionStorage.getItem(`balance-unlocked-${uid}`);
                setHasPin(!!pinHash);
                setPinLocked(!!pinHash && !sessionUnlocked);
            }
            setPinChecked(true);

            // Real-time listener: accounts
            const unsubAccounts = onSnapshot(
                query(accountsCol(uid), orderBy('createdAt', 'asc')),
                (snap) => {
                    setAccounts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
                },
            );

            // Real-time listener: transactions
            const unsubTransactions = onSnapshot(
                query(transactionsCol(uid), orderBy('date', 'desc')),
                (snap) => {
                    setTransactions(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
                    setLoading(false);
                },
            );

            // One-time prefs read (categories) — also set up listener
            const unsubPrefs = onSnapshot(prefsRef, (snap) => {
                if (snap.exists()) setCategories(snap.data().categories || DEFAULT_CATEGORIES);
            });

            // Return cleanup for when user signs out
            return () => {
                unsubAccounts();
                unsubTransactions();
                unsubPrefs();
            };
        });

        return () => unsubAuth();
    }, []);

    // ── Toast ────────────────────────────────────────────────────────────────
    const showToast = useCallback((message) => {
        setToast(message);
        setTimeout(() => setToast(null), 2200);
    }, []);

    // ── Sign out ─────────────────────────────────────────────────────────────
    const handleSignOut = useCallback(async () => {
        await signOut(auth);
        showToast('Signed out');
    }, [showToast]);

    // ── Accounts ─────────────────────────────────────────────────────────────
    const addAccount = useCallback(async (name, openingBalance) => {
        if (!user) return;
        await addDoc(accountsCol(user.uid), {
            name,
            openingBalance: Number(openingBalance),
            minBalanceAlert: 0,
            createdAt: serverTimestamp(),
        });
        showToast(`${name} added`);
    }, [user, showToast]);

    const updateAccount = useCallback(async (id, updates) => {
        if (!user) return;
        await updateDoc(doc(accountsCol(user.uid), id), updates);
    }, [user]);

    const deleteAccount = useCallback(async (id) => {
        if (!user) return;
        const batch = writeBatch(db);
        // Delete the account
        batch.delete(doc(accountsCol(user.uid), id));
        // Delete all its transactions
        const relatedTxns = transactions.filter(
            (t) => t.accountId === id || t.toAccountId === id,
        );
        for (const t of relatedTxns) {
            batch.delete(doc(transactionsCol(user.uid), t.id));
        }
        await batch.commit();
        showToast('Account deleted');
    }, [user, transactions, showToast]);

    // ── Transactions ──────────────────────────────────────────────────────────
    const addTransaction = useCallback(async (txn) => {
        if (!user) return;
        await addDoc(transactionsCol(user.uid), {
            ...txn,
            createdAt: serverTimestamp(),
        });
        showToast(txn.type === 'transfer' ? 'Transfer recorded' : 'Transaction added');
    }, [user, showToast]);

    const deleteTransaction = useCallback(async (id) => {
        if (!user) return;
        await deleteDoc(doc(transactionsCol(user.uid), id));
        showToast('Transaction deleted');
    }, [user, showToast]);

    // ── Categories ────────────────────────────────────────────────────────────
    const addCategory = useCallback(async (name) => {
        if (!user) return;
        const updated = categories.includes(name) ? categories : [...categories, name];
        if (updated.length === categories.length) return;
        await setDoc(metaDoc(user.uid), { categories: updated }, { merge: true });
    }, [user, categories]);

    // ── PIN ───────────────────────────────────────────────────────────────────
    const setupPin = useCallback(async (pin) => {
        if (!user) return;
        const hash = await hashPin(pin);
        await setDoc(metaDoc(user.uid), { pinHash: hash }, { merge: true });
        sessionStorage.setItem(`balance-unlocked-${user.uid}`, '1');
        setHasPin(true);
        setPinLocked(false);
        showToast('PIN set successfully');
    }, [user, showToast]);

    const unlockWithPin = useCallback(async (pin) => {
        if (!user) return false;
        const hash = await hashPin(pin);
        const snap = await getDoc(metaDoc(user.uid));
        if (snap.exists() && snap.data().pinHash === hash) {
            sessionStorage.setItem(`balance-unlocked-${user.uid}`, '1');
            setPinLocked(false);
            return true;
        }
        return false;
    }, [user]);

    // ── Computed: account balances ────────────────────────────────────────────
    const accountBalances = useMemo(() => {
        const balances = {};
        for (const acc of accounts) {
            balances[acc.id] = acc.openingBalance;
        }
        for (const txn of transactions) {
            if (txn.type === 'transfer') {
                if (balances[txn.accountId] !== undefined) balances[txn.accountId] -= txn.amount;
                if (balances[txn.toAccountId] !== undefined) balances[txn.toAccountId] += txn.amount;
            } else {
                if (balances[txn.accountId] === undefined) continue;
                if (txn.type === 'income') balances[txn.accountId] += txn.amount;
                else balances[txn.accountId] -= txn.amount;
            }
        }
        return balances;
    }, [accounts, transactions]);

    // ── Computed: monthly account totals ──────────────────────────────────────
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
                if (txn.type === 'income') totals[txn.accountId].income += txn.amount;
                else totals[txn.accountId].expense += txn.amount;
            }
        }
        return totals;
    }, [accounts, transactions, selectedMonth]);

    // ── Computed: global totals ───────────────────────────────────────────────
    const globalTotals = useMemo(() => {
        const { month, year } = selectedMonth;
        const monthTxns = filterTransactionsByMonth(transactions, month, year);
        const { income, expense, net } = calculateTotals(monthTxns);
        const totalBalance = Object.values(accountBalances).reduce((s, b) => s + b, 0);
        return { totalBalance, income, expense, net };
    }, [transactions, accountBalances, selectedMonth]);

    // ── Context value ─────────────────────────────────────────────────────────
    const value = useMemo(() => ({
        user,
        accounts,
        transactions,
        categories,
        activeTab,
        selectedMonth,
        toast,
        theme,
        loading,
        hasPin,
        pinLocked,
        pinChecked,
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
        setupPin,
        unlockWithPin,
        showToast,
        toggleTheme,
        handleSignOut,
    }), [
        user, accounts, transactions, categories, activeTab, selectedMonth,
        toast, theme, loading, hasPin, pinLocked, pinChecked,
        accountBalances, monthlyAccountTotals, globalTotals,
        addAccount, updateAccount, deleteAccount,
        addTransaction, deleteTransaction, addCategory,
        setupPin, unlockWithPin,
        showToast, toggleTheme, handleSignOut,
    ]);

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error('useApp must be inside AppProvider');
    return ctx;
}
