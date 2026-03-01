import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { formatCurrency, filterTransactionsByMonth } from '../utils/helpers';
import { IconPlus, IconArrowUp, IconArrowDown, IconSun, IconMoon } from '../components/Icons';
import TransactionItem from '../components/TransactionItem';
import AddAccountModal from '../components/AddAccountModal';
import AddTransactionModal from '../components/AddTransactionModal';

const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } },
};

export default function Dashboard() {
    const {
        accounts, transactions, accountBalances,
        monthlyAccountTotals, globalTotals, selectedMonth,
        theme, toggleTheme, handleSignOut, user,
    } = useApp();

    const [showAddAccount, setShowAddAccount] = useState(false);
    const [showAddTxn, setShowAddTxn] = useState(false);

    const recentTransactions = useMemo(() => {
        const { month, year } = selectedMonth;
        return filterTransactionsByMonth(transactions, month, year).slice(0, 15);
    }, [transactions, selectedMonth]);

    return (
        <div className="page">
            <div className="container">
                <motion.div variants={stagger} initial="hidden" animate="show">
                    {/* Header */}
                    <motion.div variants={fadeUp} className="page-header">
                        <div>
                            <div className="text-label" style={{ marginBottom: '4px' }}>Balance</div>
                            <h1 className="text-display">{formatCurrency(globalTotals.totalBalance)}</h1>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                                className="theme-toggle"
                                onClick={toggleTheme}
                                id="theme-toggle-btn"
                                aria-label="Toggle theme"
                                title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                            >
                                <AnimatePresence mode="wait" initial={false}>
                                    <motion.span
                                        key={theme}
                                        initial={{ rotate: -30, opacity: 0, scale: 0.7 }}
                                        animate={{ rotate: 0, opacity: 1, scale: 1 }}
                                        exit={{ rotate: 30, opacity: 0, scale: 0.7 }}
                                        transition={{ duration: 0.2 }}
                                        style={{ display: 'flex', alignItems: 'center' }}
                                    >
                                        {theme === 'dark' ? <IconSun size={16} /> : <IconMoon size={16} />}
                                    </motion.span>
                                </AnimatePresence>
                            </button>
                            <button
                                className="theme-toggle"
                                onClick={handleSignOut}
                                id="sign-out-btn"
                                aria-label="Sign out"
                                title={`Sign out (${user?.email})`}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                    <polyline points="16 17 21 12 16 7" />
                                    <line x1="21" y1="12" x2="9" y2="12" />
                                </svg>
                            </button>
                        </div>
                    </motion.div>

                    {/* Global Stats */}
                    <motion.div
                        variants={fadeUp}
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: '10px',
                            marginBottom: '24px',
                        }}
                    >
                        <div className="card" style={{ padding: '14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                                <div style={{
                                    width: 20, height: 20, borderRadius: 6,
                                    background: 'var(--income-muted)', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center',
                                    color: 'var(--income)',
                                }}>
                                    <IconArrowDown size={12} />
                                </div>
                                <span className="text-label" style={{ fontSize: '0.5625rem' }}>Income</span>
                            </div>
                            <div style={{ fontSize: '0.9375rem', fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: 'var(--income)' }}>
                                {formatCurrency(globalTotals.income)}
                            </div>
                        </div>

                        <div className="card" style={{ padding: '14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                                <div style={{
                                    width: 20, height: 20, borderRadius: 6,
                                    background: 'var(--expense-muted)', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center',
                                    color: 'var(--expense)',
                                }}>
                                    <IconArrowUp size={12} />
                                </div>
                                <span className="text-label" style={{ fontSize: '0.5625rem' }}>Expenses</span>
                            </div>
                            <div style={{ fontSize: '0.9375rem', fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: 'var(--expense)' }}>
                                {formatCurrency(globalTotals.expense)}
                            </div>
                        </div>

                        <div className="card" style={{ padding: '14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                                <div style={{
                                    width: 20, height: 20, borderRadius: 6,
                                    background: 'var(--accent-muted)', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center',
                                    color: 'var(--accent)',
                                }}>
                                    <span style={{ fontSize: '0.625rem', fontWeight: 700 }}>±</span>
                                </div>
                                <span className="text-label" style={{ fontSize: '0.5625rem' }}>Net</span>
                            </div>
                            <div style={{
                                fontSize: '0.9375rem', fontWeight: 600, fontVariantNumeric: 'tabular-nums',
                                color: globalTotals.net >= 0 ? 'var(--income)' : 'var(--expense)',
                            }}>
                                {globalTotals.net >= 0 ? '+' : ''}{formatCurrency(globalTotals.net)}
                            </div>
                        </div>
                    </motion.div>

                    {/* Account Cards */}
                    <motion.div variants={fadeUp}>
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            marginBottom: '12px',
                        }}>
                            <span className="text-label">Accounts</span>
                            <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => setShowAddAccount(true)}
                                id="add-account-btn"
                                style={{ fontSize: '0.75rem', gap: '4px' }}
                            >
                                <IconPlus size={14} /> Add
                            </button>
                        </div>

                        {accounts.length === 0 ? (
                            <div className="card" style={{
                                padding: '32px 20px',
                                textAlign: 'center',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '8px',
                            }}>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                    No accounts yet
                                </div>
                                <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => setShowAddAccount(true)}
                                    id="add-first-account"
                                >
                                    <IconPlus size={14} />
                                    Add Your First Account
                                </button>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                                {accounts.map((acc) => {
                                    const balance = accountBalances[acc.id] || 0;
                                    const monthData = monthlyAccountTotals[acc.id] || { income: 0, expense: 0 };
                                    const isLow = acc.minBalanceAlert > 0 && balance < acc.minBalanceAlert;

                                    return (
                                        <motion.div
                                            key={acc.id}
                                            className="card"
                                            whileTap={{ scale: 0.98 }}
                                            style={{
                                                padding: '14px 16px',
                                                borderColor: isLow ? 'var(--expense-border)' : undefined,
                                            }}
                                        >
                                            <div style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                marginBottom: '8px',
                                            }}>
                                                <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{acc.name}</span>
                                                <span style={{
                                                    fontSize: '1rem', fontWeight: 700,
                                                    fontVariantNumeric: 'tabular-nums',
                                                    color: isLow ? 'var(--expense)' : 'var(--text-primary)',
                                                }}>
                                                    {formatCurrency(balance)}
                                                </span>
                                            </div>
                                            <div style={{
                                                display: 'flex', gap: '16px', fontSize: '0.6875rem',
                                                color: 'var(--text-tertiary)',
                                            }}>
                                                <span>
                                                    <span style={{ color: 'var(--income)' }}>+{formatCurrency(monthData.income)}</span>
                                                    {' '}income
                                                </span>
                                                <span>
                                                    <span style={{ color: 'var(--expense)' }}>-{formatCurrency(monthData.expense)}</span>
                                                    {' '}expense
                                                </span>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </motion.div>

                    {/* Recent Transactions */}
                    <motion.div variants={fadeUp}>
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            marginBottom: '12px',
                        }}>
                            <span className="text-label">Recent Transactions</span>
                            <span className="text-caption" style={{ fontSize: '0.625rem' }}>
                                {recentTransactions.length} this month
                            </span>
                        </div>

                        {recentTransactions.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state-title">No transactions yet</div>
                                <div className="empty-state-text">
                                    Tap the + button to add your first transaction
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {recentTransactions.map((txn) => (
                                    <TransactionItem key={txn.id} transaction={txn} />
                                ))}
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            </div>

            {/* FAB */}
            <button
                className="fab"
                onClick={() => setShowAddTxn(true)}
                id="fab-add-transaction"
                aria-label="Add transaction"
            >
                <IconPlus size={26} />
            </button>

            <AddAccountModal isOpen={showAddAccount} onClose={() => setShowAddAccount(false)} />
            <AddTransactionModal isOpen={showAddTxn} onClose={() => setShowAddTxn(false)} />
        </div>
    );
}
