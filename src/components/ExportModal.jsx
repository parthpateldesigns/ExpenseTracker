import { motion, AnimatePresence } from 'framer-motion';
import { IconX, IconDownload } from './Icons';

export default function ExportModal({ isOpen, onClose, onExport }) {
    if (!isOpen) return null;

    const formats = [
        {
            id: 'csv',
            label: 'CSV',
            desc: 'Spreadsheet-compatible',
            color: 'var(--income)',
            bg: 'var(--income-muted)',
        },
        {
            id: 'excel',
            label: 'Excel',
            desc: 'Microsoft Excel (.xlsx)',
            color: 'var(--accent)',
            bg: 'var(--accent-muted)',
        },
        {
            id: 'pdf',
            label: 'PDF',
            desc: 'Formatted report',
            color: 'var(--expense)',
            bg: 'var(--expense-muted)',
        },
    ];

    return (
        <AnimatePresence>
            <motion.div
                className="modal-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <motion.div
                    className="modal-content"
                    initial={{ y: 60, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 60, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    onClick={(e) => e.stopPropagation()}
                    style={{ maxWidth: 400, padding: '20px' }}
                >
                    <div className="modal-handle" />
                    <div className="modal-header">
                        <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Export Transactions</h2>
                        <button className="btn-icon" onClick={onClose} id="close-export-modal">
                            <IconX />
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {formats.map((fmt) => (
                            <motion.button
                                key={fmt.id}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => { onExport(fmt.id); onClose(); }}
                                id={`export-${fmt.id}-btn`}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '14px',
                                    padding: '14px 16px',
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border-subtle)',
                                    borderRadius: 'var(--radius-md)',
                                    cursor: 'pointer',
                                    transition: 'border-color 150ms ease',
                                    textAlign: 'left',
                                    width: '100%',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-active)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
                            >
                                <div style={{
                                    width: 40, height: 40, borderRadius: 'var(--radius-sm)',
                                    background: fmt.bg, color: fmt.color,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0,
                                }}>
                                    <IconDownload size={18} />
                                </div>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                                        {fmt.label}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                                        {fmt.desc}
                                    </div>
                                </div>
                            </motion.button>
                        ))}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
