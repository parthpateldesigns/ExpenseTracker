import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import {
    formatCurrency, formatMonthYear, filterTransactionsByMonth,
    calculateTotals, groupByCategory, groupByAccount,
} from '../utils/helpers';
import { exportToCSV, exportToExcel, exportToPDF } from '../utils/export';
import { IconChevronLeft, IconChevronRight, IconArrowUp, IconArrowDown, IconSearch, IconDownload } from '../components/Icons';
import TransactionItem from '../components/TransactionItem';
import ExportModal from '../components/ExportModal';

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

    // Search & Filter state
    const [searchText, setSearchText] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterAccount, setFilterAccount] = useState('all');
    const [showFilters, setShowFilters] = useState(false);
    const [showExport, setShowExport] = useState(false);

    const monthTxns = useMemo(() => {
        return filterTransactionsByMonth(transactions, selectedMonth.month, selectedMonth.year);
    }, [transactions, selectedMonth]);

    // Apply search and filters
    const filteredTxns = useMemo(() => {
        let result = monthTxns;

        // Text search (searches category, notes, account name)
        if (searchText.trim()) {
            const q = searchText.toLowerCase().trim();
            result = result.filter((t) => {
                const cat = (t.category || '').toLowerCase();
                const notes = (t.notes || '').toLowerCase();
                const accName = (accounts.find((a) => a.id === t.accountId)?.name || '').toLowerCase();
                const toAccName = t.toAccountId
                    ? (accounts.find((a) => a.id === t.toAccountId)?.name || '').toLowerCase()
                    : '';
                return cat.includes(q) || notes.includes(q) || accName.includes(q) || toAccName.includes(q);
            });
        }

        // Type filter
        if (filterType !== 'all') {
            result = result.filter((t) => t.type === filterType);
        }

        // Category filter
        if (filterCategory !== 'all') {
            result = result.filter((t) => t.category === filterCategory);
        }

        // Account filter
        if (filterAccount !== 'all') {
            result = result.filter((t) => t.accountId === filterAccount || t.toAccountId === filterAccount);
        }

        return result;
    }, [monthTxns, searchText, filterType, filterCategory, filterAccount, accounts]);

    const totals = useMemo(() => calculateTotals(filteredTxns), [filteredTxns]);

    const expenseTxns = useMemo(() => filteredTxns.filter((t) => t.type === 'expense'), [filteredTxns]);
    const categoryBreakdown = useMemo(() => groupByCategory(expenseTxns), [expenseTxns]);
    const accountBreakdown = useMemo(() => groupByAccount(filteredTxns, accounts), [filteredTxns, accounts]);

    const maxCategoryAmount = useMemo(
        () => Math.max(...categoryBreakdown.map((c) => c.total), 1),
        [categoryBreakdown]
    );

    // Get unique categories for filter dropdown
    const availableCategories = useMemo(() => {
        const cats = new Set();
        monthTxns.forEach((t) => { if (t.category) cats.add(t.category); });
        return [...cats].sort();
    }, [monthTxns]);

    const hasActiveFilters = searchText || filterType !== 'all' || filterCategory !== 'all' || filterAccount !== 'all';

    const clearFilters = () => {
        setSearchText('');
        setFilterType('all');
        setFilterCategory('all');
        setFilterAccount('all');
    };

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

    const monthLabel = formatMonthYear(selectedMonth.month, selectedMonth.year);

    // Handle export
    const handleExport = (format) => {
        const allTotals = calculateTotals(monthTxns);
        switch (format) {
            case 'csv':
                exportToCSV(monthTxns, accounts, monthLabel);
                break;
            case 'excel':
                exportToExcel(monthTxns, accounts, monthLabel);
                break;
            case 'pdf':
                exportToPDF(monthTxns, accounts, monthLabel, allTotals);
                break;
        }
    };

    return (
        <div className="page">
            <div className="container">
                <motion.div variants={stagger} initial="hidden" animate="show">
                    {/* Month Selector */}
                    <motion.div variants={fadeUp} className="month-selector" style={{ marginBottom: '16px' }}>
                        <button onClick={prevMonth} id="prev-month">
                            <IconChevronLeft />
                        </button>
                        <span className="month-label">
                            {monthLabel}
                        </span>
                        <button onClick={nextMonth} id="next-month">
                            <IconChevronRight />
                        </button>
                    </motion.div>

                    {/* Search Bar + Filter/Export buttons */}
                    <motion.div variants={fadeUp} style={{ marginBottom: '16px' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
                            {/* Search input */}
                            <div style={{
                                flex: 1, display: 'flex', alignItems: 'center', gap: '8px',
                                background: 'var(--bg-input)', border: '1px solid var(--border-default)',
                                borderRadius: 'var(--radius-md)', padding: '0 12px',
                                transition: 'border-color 150ms ease',
                            }}>
                                <IconSearch size={15} />
                                <input
                                    type="text"
                                    placeholder="Search transactions..."
                                    value={searchText}
                                    onChange={(e) => setSearchText(e.target.value)}
                                    id="search-transactions"
                                    style={{
                                        flex: 1, padding: '9px 0', background: 'none',
                                        border: 'none', outline: 'none', color: 'var(--text-primary)',
                                        fontSize: '0.8125rem',
                                    }}
                                />
                                {searchText && (
                                    <button
                                        onClick={() => setSearchText('')}
                                        style={{
                                            background: 'none', border: 'none', color: 'var(--text-tertiary)',
                                            cursor: 'pointer', fontSize: '0.875rem', padding: '2px',
                                        }}
                                    >
                                        ×
                                    </button>
                                )}
                            </div>

                            {/* Filter toggle */}
                            <button
                                onClick={() => setShowFilters((p) => !p)}
                                id="toggle-filters"
                                className={`btn-icon ${showFilters || hasActiveFilters ? 'filter-active' : ''}`}
                                style={{
                                    background: showFilters || hasActiveFilters ? 'var(--accent-muted)' : 'var(--bg-card)',
                                    border: `1px solid ${showFilters || hasActiveFilters ? 'var(--border-active)' : 'var(--border-default)'}`,
                                    color: showFilters || hasActiveFilters ? 'var(--accent)' : 'var(--text-secondary)',
                                    borderRadius: 'var(--radius-md)',
                                    position: 'relative',
                                }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                                </svg>
                                {hasActiveFilters && (
                                    <span style={{
                                        position: 'absolute', top: -2, right: -2,
                                        width: 8, height: 8, borderRadius: '50%',
                                        background: 'var(--accent)',
                                    }} />
                                )}
                            </button>

                            {/* Export button */}
                            <button
                                onClick={() => setShowExport(true)}
                                id="export-btn"
                                className="btn-icon"
                                title="Export transactions"
                                style={{
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border-default)',
                                    color: 'var(--text-secondary)',
                                    borderRadius: 'var(--radius-md)',
                                }}
                            >
                                <IconDownload size={16} />
                            </button>
                        </div>

                        {/* Filter dropdowns (collapsible) */}
                        {showFilters && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                transition={{ duration: 0.2 }}
                                style={{ marginTop: '10px', overflow: 'hidden' }}
                            >
                                <div style={{
                                    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                                    gap: '8px',
                                }}>
                                    <div>
                                        <label style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)', display: 'block', marginBottom: '4px', fontWeight: 500 }}>
                                            Type
                                        </label>
                                        <select
                                            className="input"
                                            value={filterType}
                                            onChange={(e) => setFilterType(e.target.value)}
                                            id="filter-type"
                                            style={{ fontSize: '0.75rem', padding: '7px 10px' }}
                                        >
                                            <option value="all">All</option>
                                            <option value="income">Income</option>
                                            <option value="expense">Expense</option>
                                            <option value="transfer">Transfer</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)', display: 'block', marginBottom: '4px', fontWeight: 500 }}>
                                            Category
                                        </label>
                                        <select
                                            className="input"
                                            value={filterCategory}
                                            onChange={(e) => setFilterCategory(e.target.value)}
                                            id="filter-category"
                                            style={{ fontSize: '0.75rem', padding: '7px 10px' }}
                                        >
                                            <option value="all">All</option>
                                            {availableCategories.map((cat) => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)', display: 'block', marginBottom: '4px', fontWeight: 500 }}>
                                            Account
                                        </label>
                                        <select
                                            className="input"
                                            value={filterAccount}
                                            onChange={(e) => setFilterAccount(e.target.value)}
                                            id="filter-account"
                                            style={{ fontSize: '0.75rem', padding: '7px 10px' }}
                                        >
                                            <option value="all">All</option>
                                            {accounts.map((acc) => (
                                                <option key={acc.id} value={acc.id}>{acc.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                {hasActiveFilters && (
                                    <button
                                        onClick={clearFilters}
                                        id="clear-filters"
                                        style={{
                                            marginTop: '8px', fontSize: '0.75rem', color: 'var(--accent)',
                                            background: 'none', border: 'none', cursor: 'pointer',
                                            fontWeight: 500, padding: '4px 0',
                                        }}
                                    >
                                        Clear all filters
                                    </button>
                                )}
                            </motion.div>
                        )}
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

                    {/* Active filter indicator */}
                    {hasActiveFilters && (
                        <motion.div variants={fadeUp} style={{ marginBottom: '16px' }}>
                            <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '8px 12px', background: 'var(--accent-muted)',
                                borderRadius: 'var(--radius-sm)', fontSize: '0.75rem',
                                color: 'var(--accent)', fontWeight: 500,
                            }}>
                                <span>Showing {filteredTxns.length} of {monthTxns.length} transactions</span>
                                <button
                                    onClick={clearFilters}
                                    style={{
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        color: 'var(--accent)', fontSize: '0.75rem', fontWeight: 600,
                                        textDecoration: 'underline',
                                    }}
                                >
                                    Clear
                                </button>
                            </div>
                        </motion.div>
                    )}

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
                            All Transactions ({filteredTxns.length})
                        </span>
                        {filteredTxns.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state-title">
                                    {hasActiveFilters ? 'No matching transactions' : 'No transactions'}
                                </div>
                                <div className="empty-state-text">
                                    {hasActiveFilters
                                        ? 'Try adjusting your search or filters'
                                        : `No transactions recorded for ${monthLabel}`
                                    }
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {filteredTxns.map((txn) => (
                                    <TransactionItem key={txn.id} transaction={txn} />
                                ))}
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            </div>

            <ExportModal
                isOpen={showExport}
                onClose={() => setShowExport(false)}
                onExport={handleExport}
            />
        </div>
    );
}
