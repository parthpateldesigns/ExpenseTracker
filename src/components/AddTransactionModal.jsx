import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { IconX } from './Icons';
import { getTodayString } from '../utils/helpers';

export default function AddTransactionModal({ isOpen, onClose }) {
    const { accounts, categories, addTransaction, addCategory } = useApp();
    const [type, setType] = useState('expense');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [accountId, setAccountId] = useState('');
    const [toAccountId, setToAccountId] = useState('');
    const [notes, setNotes] = useState('');
    const [date, setDate] = useState(getTodayString());
    const [showAddCategory, setShowAddCategory] = useState(false);
    const [newCategory, setNewCategory] = useState('');

    const isTransfer = type === 'transfer';

    const resetForm = () => {
        setType('expense');
        setAmount('');
        setCategory('');
        setAccountId('');
        setToAccountId('');
        setNotes('');
        setDate(getTodayString());
        setShowAddCategory(false);
        setNewCategory('');
    };

    const canSubmit = isTransfer
        ? !!(amount && accountId && toAccountId && accountId !== toAccountId)
        : !!(amount && category && accountId);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!canSubmit) return;

        if (isTransfer) {
            addTransaction({
                type: 'transfer',
                amount: parseFloat(amount),
                category: 'Transfer',
                accountId,
                toAccountId,
                notes: notes.trim(),
                date,
            });
        } else {
            addTransaction({
                type,
                amount: parseFloat(amount),
                category,
                accountId,
                notes: notes.trim(),
                date,
            });
        }
        resetForm();
        onClose();
    };

    const handleAddCategory = () => {
        if (!newCategory.trim()) return;
        addCategory(newCategory.trim());
        setCategory(newCategory.trim());
        setNewCategory('');
        setShowAddCategory(false);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    // For transfer, filter out the selected "from" account from the "to" options
    const toAccountOptions = accounts.filter((a) => a.id !== accountId);

    // Style for the active type pill
    const getTypeStyle = (t) => {
        if (type !== t) return {};
        if (t === 'expense') return { color: 'var(--expense)', background: 'var(--expense-muted)' };
        if (t === 'income') return { color: 'var(--income)', background: 'var(--income-muted)' };
        if (t === 'transfer') return { color: 'var(--accent)', background: 'var(--accent-muted)' };
        return {};
    };

    // Submit button style & label
    const getSubmitStyle = () => {
        if (!canSubmit) return { opacity: 0.4 };
        if (type === 'income') return { background: 'var(--income)' };
        if (type === 'expense') return { background: 'var(--expense)' };
        if (type === 'transfer') return { background: 'var(--accent)' };
        return {};
    };

    const getSubmitLabel = () => {
        if (type === 'income') return 'Add Income';
        if (type === 'expense') return 'Add Expense';
        return 'Transfer';
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="modal-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={handleClose}
                >
                    <motion.div
                        className="modal-content"
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 340 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-handle" />
                        <div className="modal-header">
                            <h2 className="text-title">
                                {isTransfer ? 'Self Transfer' : 'Add Transaction'}
                            </h2>
                            <button className="btn-icon btn-ghost" onClick={handleClose} id="close-add-txn">
                                <IconX />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {/* Type Toggle — 3 options */}
                            <div className="tab-pills">
                                <button
                                    type="button"
                                    className={`tab-pill ${type === 'expense' ? 'active' : ''}`}
                                    onClick={() => setType('expense')}
                                    id="type-expense"
                                    style={getTypeStyle('expense')}
                                >
                                    Expense
                                </button>
                                <button
                                    type="button"
                                    className={`tab-pill ${type === 'income' ? 'active' : ''}`}
                                    onClick={() => setType('income')}
                                    id="type-income"
                                    style={getTypeStyle('income')}
                                >
                                    Income
                                </button>
                                <button
                                    type="button"
                                    className={`tab-pill ${type === 'transfer' ? 'active' : ''}`}
                                    onClick={() => setType('transfer')}
                                    id="type-transfer"
                                    style={getTypeStyle('transfer')}
                                >
                                    Transfer
                                </button>
                            </div>

                            {/* Amount */}
                            <div className="input-group">
                                <label htmlFor="txn-amount">Amount</label>
                                <input
                                    id="txn-amount"
                                    className="input"
                                    type="number"
                                    placeholder="₹0"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    min="0"
                                    step="0.01"
                                    autoFocus
                                    style={{ fontSize: '1.25rem', fontWeight: 600, letterSpacing: '-0.02em' }}
                                />
                            </div>

                            {/* Transfer: From → To accounts */}
                            {isTransfer ? (
                                <>
                                    <div className="input-group">
                                        <label htmlFor="txn-from-account">From Account</label>
                                        <select
                                            id="txn-from-account"
                                            className="input"
                                            value={accountId}
                                            onChange={(e) => {
                                                setAccountId(e.target.value);
                                                // Reset "to" if same as new "from"
                                                if (toAccountId === e.target.value) setToAccountId('');
                                            }}
                                        >
                                            <option value="">Select source account</option>
                                            {accounts.map((a) => (
                                                <option key={a.id} value={a.id}>{a.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Arrow indicator */}
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'var(--accent)',
                                        gap: '8px',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        letterSpacing: '0.04em',
                                    }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="12" y1="5" x2="12" y2="19" />
                                            <polyline points="19 12 12 19 5 12" />
                                        </svg>
                                        TRANSFER TO
                                    </div>

                                    <div className="input-group">
                                        <label htmlFor="txn-to-account">To Account</label>
                                        <select
                                            id="txn-to-account"
                                            className="input"
                                            value={toAccountId}
                                            onChange={(e) => setToAccountId(e.target.value)}
                                        >
                                            <option value="">Select destination account</option>
                                            {toAccountOptions.map((a) => (
                                                <option key={a.id} value={a.id}>{a.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Validation hint */}
                                    {accountId && toAccountId && accountId === toAccountId && (
                                        <div style={{
                                            fontSize: '0.75rem',
                                            color: 'var(--expense)',
                                            textAlign: 'center',
                                        }}>
                                            Source and destination must be different
                                        </div>
                                    )}
                                </>
                            ) : (
                                <>
                                    {/* Category (only for income/expense) */}
                                    <div className="input-group">
                                        <label htmlFor="txn-category">Category</label>
                                        {!showAddCategory ? (
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <select
                                                    id="txn-category"
                                                    className="input"
                                                    value={category}
                                                    onChange={(e) => setCategory(e.target.value)}
                                                    style={{ flex: 1 }}
                                                >
                                                    <option value="">Select category</option>
                                                    {categories.map((c) => (
                                                        <option key={c} value={c}>{c}</option>
                                                    ))}
                                                </select>
                                                <button
                                                    type="button"
                                                    className="btn btn-secondary btn-sm"
                                                    onClick={() => setShowAddCategory(true)}
                                                    style={{ whiteSpace: 'nowrap', fontSize: '0.75rem' }}
                                                >
                                                    + New
                                                </button>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <input
                                                    className="input"
                                                    type="text"
                                                    placeholder="Category name"
                                                    value={newCategory}
                                                    onChange={(e) => setNewCategory(e.target.value)}
                                                    autoFocus
                                                    style={{ flex: 1 }}
                                                />
                                                <button
                                                    type="button"
                                                    className="btn btn-primary btn-sm"
                                                    onClick={handleAddCategory}
                                                    disabled={!newCategory.trim()}
                                                >
                                                    Add
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-ghost btn-sm"
                                                    onClick={() => setShowAddCategory(false)}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Account (for income/expense) */}
                                    <div className="input-group">
                                        <label htmlFor="txn-account">Account</label>
                                        <select
                                            id="txn-account"
                                            className="input"
                                            value={accountId}
                                            onChange={(e) => setAccountId(e.target.value)}
                                        >
                                            <option value="">Select account</option>
                                            {accounts.map((a) => (
                                                <option key={a.id} value={a.id}>{a.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </>
                            )}

                            {/* Notes */}
                            <div className="input-group">
                                <label htmlFor="txn-notes">Notes (optional)</label>
                                <input
                                    id="txn-notes"
                                    className="input"
                                    type="text"
                                    placeholder={isTransfer ? 'e.g., Moving funds for CC payment' : 'Add notes...'}
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </div>

                            {/* Date */}
                            <div className="input-group">
                                <label htmlFor="txn-date">Date</label>
                                <input
                                    id="txn-date"
                                    className="input"
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary"
                                id="submit-add-txn"
                                disabled={!canSubmit}
                                style={{ marginTop: '8px', ...getSubmitStyle() }}
                            >
                                {getSubmitLabel()}
                            </button>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
