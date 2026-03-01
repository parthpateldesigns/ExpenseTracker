import { AnimatePresence, motion } from 'framer-motion';

export default function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel }) {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="modal-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    onClick={onCancel}
                    style={{ alignItems: 'center' }}
                >
                    <motion.div
                        className="confirm-dialog"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3>{title || 'Confirm'}</h3>
                        <p>{message || 'Are you sure?'}</p>
                        <div className="confirm-actions">
                            <button className="btn btn-secondary" onClick={onCancel} id="confirm-cancel">
                                Cancel
                            </button>
                            <button className="btn btn-danger" onClick={onConfirm} id="confirm-delete">
                                Delete
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
