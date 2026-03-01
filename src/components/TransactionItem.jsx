import { useState, useRef } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate } from '../utils/helpers';
import { IconArrowUp, IconArrowDown, IconTrash, IconTransfer } from './Icons';
import ConfirmDialog from './ConfirmDialog';

export default function TransactionItem({ transaction }) {
    const { accounts, deleteTransaction } = useApp();
    const [showConfirm, setShowConfirm] = useState(false);
    const constraintRef = useRef(null);
    const x = useMotionValue(0);
    const deleteOpacity = useTransform(x, [-120, -60], [1, 0]);
    const deleteScale = useTransform(x, [-120, -60], [1, 0.8]);

    const account = accounts.find((a) => a.id === transaction.accountId);
    const toAccount = transaction.toAccountId
        ? accounts.find((a) => a.id === transaction.toAccountId)
        : null;
    const isIncome = transaction.type === 'income';
    const isTransfer = transaction.type === 'transfer';

    const handleDragEnd = () => {
        if (x.get() < -80) {
            setShowConfirm(true);
        }
        animate(x, 0, { type: 'spring', stiffness: 400, damping: 30 });
    };

    const handleDelete = () => {
        deleteTransaction(transaction.id);
        setShowConfirm(false);
    };

    // Icon background/color based on type
    const getIconStyle = () => {
        if (isTransfer) return { background: 'var(--accent-muted)', color: 'var(--accent)' };
        if (isIncome) return { background: 'var(--income-muted)', color: 'var(--income)' };
        return { background: 'var(--expense-muted)', color: 'var(--expense)' };
    };

    const getAmountColor = () => {
        if (isTransfer) return 'var(--accent)';
        if (isIncome) return 'var(--income)';
        return 'var(--expense)';
    };

    const getAmountPrefix = () => {
        if (isTransfer) return '';
        return isIncome ? '+' : '-';
    };

    // Subtitle text
    const getSubtitle = () => {
        if (isTransfer) {
            return `${account?.name || '?'} → ${toAccount?.name || '?'}`;
        }
        return account?.name || 'Unknown';
    };

    // Confirm message
    const getConfirmMessage = () => {
        if (isTransfer) {
            return `Remove ${formatCurrency(transaction.amount)} transfer from ${account?.name || '?'} to ${toAccount?.name || '?'}?`;
        }
        return `Remove ${formatCurrency(transaction.amount)} ${transaction.category} transaction?`;
    };

    return (
        <>
            <div
                ref={constraintRef}
                style={{
                    position: 'relative',
                    overflow: 'hidden',
                    borderRadius: 'var(--radius-md)',
                }}
            >
                {/* Delete background */}
                <motion.div
                    className="swipe-delete-bg"
                    style={{
                        opacity: deleteOpacity,
                        scale: deleteScale,
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        paddingRight: '20px',
                        gap: '6px',
                    }}
                >
                    <IconTrash size={16} />
                    Delete
                </motion.div>

                {/* Content */}
                <motion.div
                    drag="x"
                    dragConstraints={{ left: -130, right: 0 }}
                    dragElastic={0.2}
                    onDragEnd={handleDragEnd}
                    style={{
                        x,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 14px',
                        background: 'var(--bg-card)',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'grab',
                        touchAction: 'pan-y',
                    }}
                >
                    {/* Icon */}
                    <div
                        style={{
                            width: 36,
                            height: 36,
                            borderRadius: 'var(--radius-sm)',
                            ...getIconStyle(),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                        }}
                    >
                        {isTransfer ? (
                            <IconTransfer size={16} />
                        ) : isIncome ? (
                            <IconArrowDown size={16} />
                        ) : (
                            <IconArrowUp size={16} />
                        )}
                    </div>

                    {/* Details */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            marginBottom: '2px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}>
                            {isTransfer ? 'Self Transfer' : transaction.category}
                        </div>
                        <div style={{
                            fontSize: '0.6875rem',
                            color: 'var(--text-tertiary)',
                            display: 'flex',
                            gap: '6px',
                            alignItems: 'center',
                        }}>
                            <span>{getSubtitle()}</span>
                            <span>·</span>
                            <span>{formatDate(transaction.date)}</span>
                            {transaction.notes && (
                                <>
                                    <span>·</span>
                                    <span style={{
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        maxWidth: '100px',
                                    }}>{transaction.notes}</span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Amount */}
                    <div style={{
                        fontSize: '0.9375rem',
                        fontWeight: 600,
                        color: getAmountColor(),
                        fontVariantNumeric: 'tabular-nums',
                        flexShrink: 0,
                    }}>
                        {getAmountPrefix()}{formatCurrency(transaction.amount)}
                    </div>
                </motion.div>
            </div>

            <ConfirmDialog
                isOpen={showConfirm}
                title={isTransfer ? 'Delete Transfer?' : 'Delete Transaction?'}
                message={getConfirmMessage()}
                onConfirm={handleDelete}
                onCancel={() => setShowConfirm(false)}
            />
        </>
    );
}
