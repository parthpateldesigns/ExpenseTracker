import { useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/helpers';
import { IconPlus, IconEdit, IconAlertCircle } from '../components/Icons';
import AddAccountModal from '../components/AddAccountModal';
import EditAccountModal from '../components/EditAccountModal';
import AccountStatementModal from '../components/AccountStatementModal';

const fadeUp = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } },
};

const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.06 } },
};

export default function AccountsPage() {
    const { accounts, accountBalances, globalTotals } = useApp();
    const [showAddAccount, setShowAddAccount] = useState(false);
    const [editAccount, setEditAccount] = useState(null);
    const [statementAccount, setStatementAccount] = useState(null);

    const totalBalance = globalTotals.totalBalance;

    return (
        <div className="page">
            <div className="container">
                <motion.div variants={stagger} initial="hidden" animate="show">
                    {/* Header */}
                    <motion.div variants={fadeUp} className="page-header">
                        <h1 className="page-title">Accounts</h1>
                        <button
                            className="btn btn-primary btn-sm"
                            onClick={() => setShowAddAccount(true)}
                            id="accounts-add-btn"
                        >
                            <IconPlus size={16} />
                            Add
                        </button>
                    </motion.div>

                    {/* Total */}
                    <motion.div variants={fadeUp} className="card" style={{
                        padding: '20px',
                        marginBottom: '24px',
                        background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(99, 140, 255, 0.04) 100%)',
                        borderColor: 'rgba(99, 140, 255, 0.1)',
                    }}>
                        <div className="text-label" style={{ marginBottom: '6px' }}>Total Balance</div>
                        <div className="text-display" style={{ fontSize: '1.75rem' }}>
                            {formatCurrency(totalBalance)}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                            Across {accounts.length} account{accounts.length !== 1 ? 's' : ''}
                        </div>
                    </motion.div>

                    {/* Account Cards */}
                    {accounts.length === 0 ? (
                        <motion.div variants={fadeUp} className="empty-state">
                            <div className="empty-state-title">No accounts</div>
                            <div className="empty-state-text">
                                Add your bank accounts to start tracking balances
                            </div>
                            <button
                                className="btn btn-primary btn-sm"
                                onClick={() => setShowAddAccount(true)}
                                id="empty-add-account"
                                style={{ marginTop: '8px' }}
                            >
                                <IconPlus size={14} /> Add Account
                            </button>
                        </motion.div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {accounts.map((acc) => {
                                const balance = accountBalances[acc.id] || 0;
                                const pct = totalBalance > 0 ? ((balance / totalBalance) * 100) : 0;
                                const isLow = acc.minBalanceAlert > 0 && balance < acc.minBalanceAlert;

                                return (
                                    <motion.div
                                        key={acc.id}
                                        variants={fadeUp}
                                        className="card"
                                        style={{
                                            padding: '16px',
                                            cursor: 'pointer',
                                            borderColor: isLow ? 'var(--expense-border)' : undefined,
                                        }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setEditAccount(acc)}
                                    >
                                        <div style={{
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                                            marginBottom: '10px',
                                        }}>
                                            <div>
                                                <div style={{
                                                    display: 'flex', alignItems: 'center', gap: '8px',
                                                    marginBottom: '4px',
                                                }}>
                                                    <span style={{ fontSize: '0.9375rem', fontWeight: 600 }}>{acc.name}</span>
                                                    {isLow && (
                                                        <span style={{ color: 'var(--expense)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <IconAlertCircle size={14} />
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-display" style={{
                                                    fontSize: '1.375rem',
                                                    color: isLow ? 'var(--expense)' : 'var(--text-primary)',
                                                }}>
                                                    {formatCurrency(balance)}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                <button
                                                    className="btn btn-ghost btn-sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setStatementAccount(acc);
                                                    }}
                                                    id={`statement-${acc.id}`}
                                                    style={{
                                                        fontSize: '0.6875rem', fontWeight: 600, gap: '4px',
                                                        color: 'var(--accent)', padding: '5px 9px',
                                                        border: '1px solid var(--border-active)',
                                                        borderRadius: 'var(--radius-sm)',
                                                    }}
                                                >
                                                    Statement
                                                </button>
                                                <button
                                                    className="btn-icon btn-ghost"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditAccount(acc);
                                                    }}
                                                    id={`edit-${acc.id}`}
                                                >
                                                    <IconEdit size={16} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Progress bar showing % of total */}
                                        <div style={{ marginBottom: '4px' }}>
                                            <div style={{
                                                height: 4,
                                                borderRadius: 2,
                                                background: 'var(--border-default)',
                                                overflow: 'hidden',
                                            }}>
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${Math.max(pct, 0)}%` }}
                                                    transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1], delay: 0.2 }}
                                                    style={{
                                                        height: '100%',
                                                        borderRadius: 2,
                                                        background: isLow ? 'var(--expense)' : 'var(--accent)',
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div style={{
                                            display: 'flex', justifyContent: 'space-between',
                                            fontSize: '0.6875rem', color: 'var(--text-tertiary)',
                                        }}>
                                            <span>{pct.toFixed(1)}% of total</span>
                                            {isLow && (
                                                <span style={{ color: 'var(--expense)', fontWeight: 500 }}>
                                                    Below {formatCurrency(acc.minBalanceAlert)}
                                                </span>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </motion.div>
            </div>

            <AddAccountModal isOpen={showAddAccount} onClose={() => setShowAddAccount(false)} />
            <EditAccountModal
                isOpen={!!editAccount}
                onClose={() => setEditAccount(null)}
                account={editAccount}
            />
            <AccountStatementModal
                isOpen={!!statementAccount}
                onClose={() => setStatementAccount(null)}
                account={statementAccount}
            />
        </div>
    );
}
