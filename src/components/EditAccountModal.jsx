import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { IconX, IconTrash } from './Icons';
import { formatCurrency } from '../utils/helpers';
import ConfirmDialog from './ConfirmDialog';

export default function EditAccountModal({ isOpen, onClose, account }) {
    const { updateAccount, deleteAccount, accountBalances } = useApp();
    const [name, setName] = useState('');
    const [openingBalance, setOpeningBalance] = useState('');
    const [minBalance, setMinBalance] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        if (account) {
            setName(account.name);
            setOpeningBalance(String(account.openingBalance));
            setMinBalance(String(account.minBalanceAlert || ''));
        }
    }, [account]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim() || !openingBalance) return;
        updateAccount(account.id, {
            name: name.trim(),
            openingBalance: parseFloat(openingBalance),
            minBalanceAlert: minBalance ? parseFloat(minBalance) : 0,
        });
        onClose();
    };

    const handleDelete = () => {
        deleteAccount(account.id);
        setShowDeleteConfirm(false);
        onClose();
    };

    if (!account) return null;

    const currentBalance = accountBalances[account.id] || 0;

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={onClose}
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
                                <h2 className="text-title">Edit Account</h2>
                                <button className="btn-icon btn-ghost" onClick={onClose} id="close-edit-account">
                                    <IconX />
                                </button>
                            </div>

                            {/* Current balance info */}
                            <div style={{
                                background: 'var(--accent-muted)',
                                borderRadius: 'var(--radius-md)',
                                padding: '12px 16px',
                                marginBottom: '20px',
                                border: '1px solid rgba(99, 140, 255, 0.1)',
                            }}>
                                <div className="text-caption" style={{ marginBottom: '4px' }}>Current Balance</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
                                    {formatCurrency(currentBalance)}
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div className="input-group">
                                    <label htmlFor="edit-account-name">Account Name</label>
                                    <input
                                        id="edit-account-name"
                                        className="input"
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                </div>

                                <div className="input-group">
                                    <label htmlFor="edit-opening-balance">Opening Balance</label>
                                    <input
                                        id="edit-opening-balance"
                                        className="input"
                                        type="number"
                                        value={openingBalance}
                                        onChange={(e) => setOpeningBalance(e.target.value)}
                                        step="0.01"
                                    />
                                </div>

                                <div className="input-group">
                                    <label htmlFor="edit-min-balance">Minimum Balance Alert (optional)</label>
                                    <input
                                        id="edit-min-balance"
                                        className="input"
                                        type="number"
                                        placeholder="₹0"
                                        value={minBalance}
                                        onChange={(e) => setMinBalance(e.target.value)}
                                        step="0.01"
                                        min="0"
                                    />
                                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>
                                        Alert when balance falls below this amount
                                    </span>
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    id="submit-edit-account"
                                    disabled={!name.trim() || !openingBalance}
                                    style={{ marginTop: '4px', opacity: (!name.trim() || !openingBalance) ? 0.4 : 1 }}
                                >
                                    Save Changes
                                </button>

                                <button
                                    type="button"
                                    className="btn btn-danger"
                                    onClick={() => setShowDeleteConfirm(true)}
                                    id="delete-account-btn"
                                    style={{ gap: '6px' }}
                                >
                                    <IconTrash size={16} />
                                    Delete Account
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <ConfirmDialog
                isOpen={showDeleteConfirm}
                title="Delete Account?"
                message={`This will remove "${account.name}" and all its transactions. This action cannot be undone.`}
                onConfirm={handleDelete}
                onCancel={() => setShowDeleteConfirm(false)}
            />
        </>
    );
}
