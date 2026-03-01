import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import {
    formatCurrency, formatMonthYear, filterTransactionsByMonth,
    calculateTotals, groupByCategory, groupByAccount,
} from '../utils/helpers';
import { IconChevronLeft, IconChevronRight, IconArrowUp, IconArrowDown } from '../components/Icons';
import TransactionItem from '../components/TransactionItem';

const fadeUp = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } },
};

const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.05 } },
};

export default function Monthly() {
    const { accounts, transactions, selectedMonth, setSelectedMonth } = useApp();

    const monthTxns = useMemo(() => {
        return filterTransactionsByMonth(transactions, selectedMonth.month, selectedMonth.year);
    }, [transactions, selectedMonth]);

    const totals = useMemo(() => calculateTotals(monthTxns), [monthTxns]);

    const expenseTxns = useMemo(() => monthTxns.filter((t) => t.type === 'expense'), [monthTxns]);
    const categoryBreakdown = useMemo(() => groupByCategory(expenseTxns), [expenseTxns]);
    const accountBreakdown = useMemo(() => groupByAccount(monthTxns, accounts), [monthTxns, accounts]);

    const maxCategoryAmount = useMemo(
        () => Math.max(...categoryBreakdown.map((c) => c.total), 1),
        [categoryBreakdown]
    );

    const prevMonth = () => {
        setSelectedMonth((prev) => {
            const m = prev.month === 0 ? 11 : prev.month - 1;
            const y = prev.month === 0 ? prev.year - 1 : prev.year;
            return { month: m, year: y };
        });
    };

    const nextMonth = () => {
        setSelectedMonth((prev) => {
            const m = prev.month === 11 ? 0 : prev.month + 1;
            const y = prev.month === 11 ? prev.year + 1 : prev.year;
            return { month: m, year: y };
        });
    };

    return (
        <div className="page">
            <div className="container">
                <motion.div variants={stagger} initial="hidden" animate="show">
                    {/* Month Selector */}
                    <motion.div variants={fadeUp} className="month-selector" style={{ marginBottom: '20px' }}>
                        <button onClick={prevMonth} id="prev-month">
                            <IconChevronLeft />
                        </button>
                        <span className="month-label">
                            {formatMonthYear(selectedMonth.month, selectedMonth.year)}
                        </span>
                        <button onClick={nextMonth} id="next-month">
                            <IconChevronRight />
                        </button>
                    </motion.div>

                    {/* Summary Cards */}
                    <motion.div
                        variants={fadeUp}
                        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '24px' }}
                    >
                        <div className="card" style={{ padding: '14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                                <div style={{
                                    width: 20, height: 20, borderRadius: 6,
                                    background: 'var(--income-muted)', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center', color: 'var(--income)',
                                }}>
                                    <IconArrowDown size={12} />
                                </div>
                                <span className="text-label" style={{ fontSize: '0.5625rem' }}>Total Income</span>
                            </div>
                            <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--income)', fontVariantNumeric: 'tabular-nums' }}>
                                {formatCurrency(totals.income)}
                            </div>
                        </div>

                        <div className="card" style={{ padding: '14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                                <div style={{
                                    width: 20, height: 20, borderRadius: 6,
                                    background: 'var(--expense-muted)', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center', color: 'var(--expense)',
                                }}>
                                    <IconArrowUp size={12} />
                                </div>
                                <span className="text-label" style={{ fontSize: '0.5625rem' }}>Total Expenses</span>
                            </div>
                            <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--expense)', fontVariantNumeric: 'tabular-nums' }}>
                                {formatCurrency(totals.expense)}
                            </div>
                        </div>
                    </motion.div>

                    {/* Category Breakdown */}
                    {categoryBreakdown.length > 0 && (
                        <motion.div variants={fadeUp} style={{ marginBottom: '24px' }}>
                            <span className="text-label" style={{ display: 'block', marginBottom: '12px' }}>
                                Category Breakdown
                            </span>
                            <div className="card" style={{ padding: '16px' }}>
                                <div className="bar-chart">
                                    {categoryBreakdown.map((cat) => (
                                        <div key={cat.category} className="bar-row">
                                            <span className="bar-label">{cat.category}</span>
                                            <div className="bar-track">
                                                <motion.div
                                                    className="bar-fill"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${(cat.total / maxCategoryAmount) * 100}%` }}
                                                    transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1], delay: 0.1 }}
                                                />
                                            </div>
                                            <span className="bar-value">{formatCurrency(cat.total)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Account-wise Expense */}
                    {accountBreakdown.length > 0 && (
                        <motion.div variants={fadeUp} style={{ marginBottom: '24px' }}>
                            <span className="text-label" style={{ display: 'block', marginBottom: '12px' }}>
                                Account-wise
                            </span>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {accountBreakdown.map(({ account, income, expense }) => (
                                    <div key={account.id} className="card" style={{ padding: '12px 16px' }}>
                                        <div style={{
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            marginBottom: '4px',
                                        }}>
                                            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{account.name}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '16px', fontSize: '0.75rem' }}>
                                            <span style={{ color: 'var(--income)' }}>+{formatCurrency(income)}</span>
                                            <span style={{ color: 'var(--expense)' }}>-{formatCurrency(expense)}</span>
                                            <span style={{
                                                color: (income - expense) >= 0 ? 'var(--income)' : 'var(--expense)',
                                                fontWeight: 600,
                                            }}>
                                                Net: {(income - expense) >= 0 ? '+' : ''}{formatCurrency(income - expense)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* All transactions this month */}
                    <motion.div variants={fadeUp}>
                        <span className="text-label" style={{ display: 'block', marginBottom: '12px' }}>
                            All Transactions ({monthTxns.length})
                        </span>
                        {monthTxns.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state-title">No transactions</div>
                                <div className="empty-state-text">
                                    No transactions recorded for {formatMonthYear(selectedMonth.month, selectedMonth.year)}
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {monthTxns.map((txn) => (
                                    <TransactionItem key={txn.id} transaction={txn} />
                                ))}
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
}
