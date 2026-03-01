import { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDateFull, formatMonthYear } from '../utils/helpers';
import { IconX, IconChevronLeft, IconChevronRight, IconTransfer, IconArrowUp, IconArrowDown } from './Icons';

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

function IconFileText({ size = 18 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
        </svg>
    );
}

export default function AccountStatementModal({ isOpen, onClose, account }) {
    const { transactions, accounts, accountBalances } = useApp();

    const now = new Date();
    const [filterMonth, setFilterMonth] = useState(now.getMonth());
    const [filterYear, setFilterYear] = useState(now.getFullYear());
    const [showAllTime, setShowAllTime] = useState(false);

    const toAccount = (id) => accounts.find((a) => a.id === id);

    // All transactions for this account (both directions for transfers)
    const allAccountTxns = useMemo(() => {
        if (!account) return [];
        return transactions
            .filter((t) => t.accountId === account.id || t.toAccountId === account.id)
            .sort((a, b) => new Date(a.date) - new Date(b.date) || new Date(a.createdAt) - new Date(b.createdAt));
    }, [transactions, account]);

    // Compute running balance entries from opening balance
    const statementRows = useMemo(() => {
        if (!account) return [];
        let running = account.openingBalance;
        return allAccountTxns.map((t) => {
            let delta = 0;
            let debit = null;
            let credit = null;

            if (t.type === 'transfer') {
                if (t.accountId === account.id) {
                    // money going OUT
                    delta = -t.amount;
                    debit = t.amount;
                } else {
                    // money coming IN
                    delta = t.amount;
                    credit = t.amount;
                }
            } else if (t.type === 'income') {
                delta = t.amount;
                credit = t.amount;
            } else {
                delta = -t.amount;
                debit = t.amount;
            }

            running += delta;
            return { txn: t, debit, credit, balance: running };
        });
    }, [allAccountTxns, account]);

    // Apply month filter
    const filteredRows = useMemo(() => {
        if (showAllTime) return statementRows;
        return statementRows.filter(({ txn }) => {
            const d = new Date(txn.date);
            return d.getMonth() === filterMonth && d.getFullYear() === filterYear;
        });
    }, [statementRows, filterMonth, filterYear, showAllTime]);

    // Summary for the filtered period
    const summary = useMemo(() => {
        let totalDebit = 0;
        let totalCredit = 0;
        for (const row of filteredRows) {
            if (row.debit) totalDebit += row.debit;
            if (row.credit) totalCredit += row.credit;
        }
        return { totalDebit, totalCredit, net: totalCredit - totalDebit };
    }, [filteredRows]);

    // Month navigation
    const prevMonth = () => {
        if (filterMonth === 0) { setFilterMonth(11); setFilterYear((y) => y - 1); }
        else setFilterMonth((m) => m - 1);
    };
    const nextMonth = () => {
        if (filterMonth === 11) { setFilterMonth(0); setFilterYear((y) => y + 1); }
        else setFilterMonth((m) => m + 1);
    };

    const currentBalance = account ? (accountBalances[account.id] ?? account.openingBalance) : 0;

    if (!account) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="modal-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={onClose}
                    style={{ alignItems: 'flex-end' }}
                >
                    <motion.div
                        className="modal-content"
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                        onClick={(e) => e.stopPropagation()}
                        style={{ maxHeight: '92vh', display: 'flex', flexDirection: 'column', padding: 0 }}
                    >
                        {/* Sticky Header */}
                        <div style={{ padding: '20px 20px 0', flexShrink: 0 }}>
                            <div className="modal-handle" />

                            {/* Title row */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{
                                        width: 36, height: 36, borderRadius: 'var(--radius-md)',
                                        background: 'var(--accent-muted)', color: 'var(--accent)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <IconFileText size={17} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Statement</div>
                                        <div style={{ fontSize: '1.0625rem', fontWeight: 700, letterSpacing: '-0.02em' }}>{account.name}</div>
                                    </div>
                                </div>
                                <button className="btn-icon btn-ghost" onClick={onClose} id="close-statement">
                                    <IconX />
                                </button>
                            </div>

                            {/* Current balance pill */}
                            <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '10px 14px', background: 'var(--bg-elevated)',
                                borderRadius: 'var(--radius-md)', marginBottom: '14px',
                                border: '1px solid var(--border-subtle)',
                            }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Current Balance</span>
                                <span style={{ fontSize: '1rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: currentBalance < 0 ? 'var(--expense)' : 'var(--text-primary)' }}>
                                    {formatCurrency(currentBalance)}
                                </span>
                            </div>

                            {/* Month filter / All-time toggle */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                {!showAllTime && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', padding: '3px 4px', border: '1px solid var(--border-subtle)' }}>
                                        <button onClick={prevMonth} style={{ width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
                                            <IconChevronLeft size={14} />
                                        </button>
                                        <span style={{ flex: 1, textAlign: 'center', fontSize: '0.8125rem', fontWeight: 600, letterSpacing: '-0.01em' }}>
                                            {MONTHS[filterMonth]} {filterYear}
                                        </span>
                                        <button onClick={nextMonth} style={{ width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
                                            <IconChevronRight size={14} />
                                        </button>
                                    </div>
                                )}
                                <button
                                    onClick={() => setShowAllTime((v) => !v)}
                                    style={{
                                        padding: '6px 12px', borderRadius: 'var(--radius-md)',
                                        fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', border: 'none',
                                        background: showAllTime ? 'var(--accent-muted)' : 'var(--bg-elevated)',
                                        color: showAllTime ? 'var(--accent)' : 'var(--text-secondary)',
                                        letterSpacing: '0.01em', whiteSpace: 'nowrap',
                                        transition: 'all 150ms ease',
                                        flexShrink: 0,
                                    }}
                                >
                                    All time
                                </button>
                            </div>

                            {/* Period summary cards */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', marginBottom: '14px' }}>
                                {[
                                    { label: 'Credited', amount: summary.totalCredit, color: 'var(--income)' },
                                    { label: 'Debited', amount: summary.totalDebit, color: 'var(--expense)' },
                                    { label: 'Net', amount: summary.net, color: summary.net >= 0 ? 'var(--income)' : 'var(--expense)' },
                                ].map(({ label, amount, color }) => (
                                    <div key={label} style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', padding: '8px 10px', border: '1px solid var(--border-subtle)' }}>
                                        <div style={{ fontSize: '0.5625rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '3px' }}>{label}</div>
                                        <div style={{ fontSize: '0.8125rem', fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>
                                            {label === 'Net' && amount >= 0 ? '+' : ''}{formatCurrency(amount)}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Column headers */}
                            <div style={{
                                display: 'grid', gridTemplateColumns: '1fr 72px 72px 80px',
                                gap: '4px', padding: '6px 10px',
                                fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.07em',
                                textTransform: 'uppercase', color: 'var(--text-muted)',
                                borderBottom: '1px solid var(--border-subtle)',
                            }}>
                                <span>Description</span>
                                <span style={{ textAlign: 'right' }}>Debit</span>
                                <span style={{ textAlign: 'right' }}>Credit</span>
                                <span style={{ textAlign: 'right' }}>Balance</span>
                            </div>
                        </div>

                        {/* Scrollable transaction rows */}
                        <div style={{ overflowY: 'auto', flex: 1, padding: '0 4px 20px' }}>
                            {filteredRows.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
                                    No transactions {showAllTime ? '' : `in ${MONTHS[filterMonth]} ${filterYear}`}
                                </div>
                            ) : (
                                [...filteredRows].reverse().map(({ txn, debit, credit, balance }, i) => {
                                    const isTransfer = txn.type === 'transfer';
                                    const isIncome = txn.type === 'income';

                                    // Description text
                                    let desc = isTransfer ? 'Self Transfer' : txn.category;
                                    let sub = '';
                                    if (isTransfer) {
                                        const fromAcc = toAccount(txn.accountId);
                                        const toAcc = toAccount(txn.toAccountId);
                                        sub = `${fromAcc?.name || '?'} → ${toAcc?.name || '?'}`;
                                    } else if (txn.notes) {
                                        sub = txn.notes;
                                    }

                                    const iconStyle = isTransfer
                                        ? { bg: 'var(--accent-muted)', color: 'var(--accent)' }
                                        : isIncome
                                            ? { bg: 'var(--income-muted)', color: 'var(--income)' }
                                            : { bg: 'var(--expense-muted)', color: 'var(--expense)' };

                                    return (
                                        <motion.div
                                            key={txn.id}
                                            initial={{ opacity: 0, y: 6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.3) }}
                                            style={{
                                                display: 'grid',
                                                gridTemplateColumns: '1fr 72px 72px 80px',
                                                gap: '4px',
                                                padding: '10px 10px',
                                                alignItems: 'center',
                                                borderBottom: '1px solid var(--border-subtle)',
                                            }}
                                        >
                                            {/* Description */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                                                <div style={{
                                                    width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                                                    background: iconStyle.bg, color: iconStyle.color,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                }}>
                                                    {isTransfer ? <IconTransfer size={13} /> : isIncome ? <IconArrowDown size={13} /> : <IconArrowUp size={13} />}
                                                </div>
                                                <div style={{ minWidth: 0 }}>
                                                    <div style={{ fontSize: '0.8rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {desc}
                                                    </div>
                                                    <div style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {formatDateFull(txn.date)}{sub ? ` · ${sub}` : ''}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Debit */}
                                            <div style={{ textAlign: 'right', fontSize: '0.78rem', fontVariantNumeric: 'tabular-nums', fontWeight: 500, color: debit ? 'var(--expense)' : 'var(--text-muted)' }}>
                                                {debit ? formatCurrency(debit) : '—'}
                                            </div>

                                            {/* Credit */}
                                            <div style={{ textAlign: 'right', fontSize: '0.78rem', fontVariantNumeric: 'tabular-nums', fontWeight: 500, color: credit ? 'var(--income)' : 'var(--text-muted)' }}>
                                                {credit ? formatCurrency(credit) : '—'}
                                            </div>

                                            {/* Running Balance */}
                                            <div style={{ textAlign: 'right', fontSize: '0.78rem', fontVariantNumeric: 'tabular-nums', fontWeight: 700, color: balance < 0 ? 'var(--expense)' : 'var(--text-primary)' }}>
                                                {formatCurrency(balance)}
                                            </div>
                                        </motion.div>
                                    );
                                })
                            )}

                            {/* Opening balance footer row (shown when all-time) */}
                            {showAllTime && (
                                <div style={{
                                    display: 'grid', gridTemplateColumns: '1fr 72px 72px 80px',
                                    gap: '4px', padding: '10px 10px',
                                    borderTop: '2px solid var(--border-default)',
                                    marginTop: '4px',
                                }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>Opening Balance</div>
                                    <div />
                                    <div />
                                    <div style={{ textAlign: 'right', fontSize: '0.78rem', fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                        {formatCurrency(account.openingBalance)}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
