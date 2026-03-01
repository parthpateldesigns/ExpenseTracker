import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { IconX, IconPlus } from './Icons';

export default function AddAccountModal({ isOpen, onClose }) {
    const { addAccount } = useApp();
    const [name, setName] = useState('');
    const [balance, setBalance] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim() || !balance) return;
        addAccount(name.trim(), parseFloat(balance));
        setName('');
        setBalance('');
        onClose();
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
                            <h2 className="text-title">Add Account</h2>
                            <button className="btn-icon btn-ghost" onClick={onClose} id="close-add-account">
                                <IconX />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div className="input-group">
                                <label htmlFor="account-name">Account Name</label>
                                <input
                                    id="account-name"
                                    className="input"
                                    type="text"
                                    placeholder="e.g., HDFC, SBI, Fi Money"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div className="input-group">
                                <label htmlFor="opening-balance">Opening Balance</label>
                                <input
                                    id="opening-balance"
                                    className="input"
                                    type="number"
                                    placeholder="₹0"
                                    value={balance}
                                    onChange={(e) => setBalance(e.target.value)}
                                    step="0.01"
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary"
                                id="submit-add-account"
                                disabled={!name.trim() || !balance}
                                style={{ marginTop: '8px', opacity: (!name.trim() || !balance) ? 0.4 : 1 }}
                            >
                                <IconPlus size={18} />
                                Add Account
                            </button>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
