import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';

// ─── Numpad key layout ────────────────────────────────────────────────────────
const KEYS = [1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'];

export default function PinScreen({ mode }) {
    // mode = 'setup' | 'unlock'
    const { setupPin, unlockWithPin, handleSignOut } = useApp();

    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [step, setStep] = useState('enter'); // 'enter' | 'confirm'
    const [error, setError] = useState('');
    const [shake, setShake] = useState(false);
    const [loading, setLoading] = useState(false);

    const displayPin = step === 'confirm' ? confirmPin : pin;

    // ── Digit helpers ─────────────────────────────────────────────────────────
    const triggerShake = () => {
        setShake(true);
        setTimeout(() => setShake(false), 500);
    };

    const handleSubmit = async (entered) => {
        if (mode === 'setup') {
            if (step === 'enter') {
                // Move to confirm step
                setStep('confirm');
                return;
            }
            // Confirm step — compare
            if (entered !== pin) {
                setError("PINs don't match. Try again.");
                triggerShake();
                setConfirmPin('');
                return;
            }
            setLoading(true);
            await setupPin(pin);
            // AppContext will flip pinLocked → false, app mounts automatically
        } else {
            // Unlock mode
            setLoading(true);
            const ok = await unlockWithPin(entered);
            setLoading(false);
            if (!ok) {
                setError('Wrong PIN. Try again.');
                triggerShake();
                setPin('');
            }
        }
    };

    const handleDigit = (digit) => {
        if (loading) return;
        const cur = step === 'confirm' ? confirmPin : pin;
        const set = step === 'confirm' ? setConfirmPin : setPin;
        if (cur.length >= 4) return;
        setError('');
        const next = cur + digit;
        set(next);
        if (next.length === 4) {
            // Small delay so the 4th dot fills in visually before submit
            setTimeout(() => handleSubmit(next), 150);
        }
    };

    const handleBackspace = () => {
        if (loading) return;
        const set = step === 'confirm' ? setConfirmPin : setPin;
        set((p) => p.slice(0, -1));
        setError('');
    };

    // ── Keyboard support ─────────────────────────────────────────────────────
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key >= '0' && e.key <= '9') {
                handleDigit(e.key);
            } else if (e.key === 'Backspace') {
                handleBackspace();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    });

    // ── Labels ────────────────────────────────────────────────────────────────
    const title =
        mode === 'setup'
            ? step === 'enter' ? 'Set your PIN' : 'Confirm PIN'
            : 'Welcome back';

    const subtitle =
        mode === 'setup'
            ? step === 'enter'
                ? 'Choose a 4‑digit PIN to protect your data'
                : 'Enter the same PIN again to confirm'
            : 'Enter your PIN to unlock Balance';

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--bg-primary)',
                padding: '24px',
                userSelect: 'none',
            }}
        >
            {/* ── Logo ── */}
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
                style={{ textAlign: 'center', marginBottom: '36px' }}
            >
                <div style={{
                    width: 68, height: 68,
                    borderRadius: 20,
                    background: 'var(--accent-muted)',
                    border: '1px solid var(--border-active)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 18px',
                    fontSize: '1.75rem',
                    boxShadow: '0 8px 32px rgba(99, 140, 255, 0.2)',
                }}>
                    ₹
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--text-primary)' }}>
                    {title}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', marginTop: '6px', lineHeight: 1.5 }}>
                    {subtitle}
                </div>
            </motion.div>

            {/* ── PIN dots ── */}
            <motion.div
                animate={shake ? { x: [-10, 10, -8, 8, -4, 4, 0] } : {}}
                transition={{ duration: 0.45 }}
                style={{ display: 'flex', gap: '18px', marginBottom: '12px' }}
            >
                {[0, 1, 2, 3].map((i) => (
                    <motion.div
                        key={i}
                        animate={{
                            scale: displayPin.length > i ? 1.25 : 1,
                            backgroundColor: displayPin.length > i
                                ? 'var(--accent)'
                                : 'transparent',
                            borderColor: displayPin.length > i
                                ? 'var(--accent)'
                                : 'var(--border-default)',
                        }}
                        transition={{ duration: 0.12 }}
                        style={{
                            width: 16, height: 16,
                            borderRadius: '50%',
                            border: '2px solid var(--border-default)',
                        }}
                    />
                ))}
            </motion.div>

            {/* ── Error message ── */}
            <div style={{ height: '28px', display: 'flex', alignItems: 'center', marginBottom: '28px' }}>
                <AnimatePresence>
                    {error && (
                        <motion.div
                            key={error}
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            style={{ fontSize: '0.8125rem', color: 'var(--expense)', textAlign: 'center' }}
                        >
                            {error}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── Numpad ── */}
            <motion.div
                initial={{ y: 24, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '10px',
                    width: '100%',
                    maxWidth: 288,
                }}
            >
                {KEYS.map((key, idx) => {
                    const isEmpty = key === '';
                    const isBackspace = key === '⌫';
                    return (
                        <motion.button
                            key={idx}
                            whileTap={!isEmpty ? { scale: 0.90 } : {}}
                            onClick={() => {
                                if (isEmpty) return;
                                if (isBackspace) handleBackspace();
                                else handleDigit(String(key));
                            }}
                            disabled={isEmpty || loading}
                            style={{
                                height: 70,
                                borderRadius: 18,
                                border: isEmpty ? 'none' : '1px solid var(--border-default)',
                                background: isEmpty ? 'transparent' : 'var(--bg-elevated)',
                                color: isBackspace ? 'var(--text-secondary)' : 'var(--text-primary)',
                                fontSize: isBackspace ? '1.3rem' : '1.6rem',
                                fontWeight: 600,
                                cursor: isEmpty ? 'default' : 'pointer',
                                fontFamily: 'inherit',
                                opacity: loading ? 0.55 : 1,
                                transition: 'background 150ms ease, border-color 150ms ease',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                            onMouseEnter={(e) => {
                                if (!isEmpty && !loading)
                                    e.currentTarget.style.borderColor = 'var(--border-active)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = 'var(--border-default)';
                            }}
                        >
                            {key}
                        </motion.button>
                    );
                })}
            </motion.div>

            {/* ── Sign out link (unlock screen only) ── */}
            {mode === 'unlock' && (
                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    onClick={handleSignOut}
                    style={{
                        marginTop: '32px',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        fontSize: '0.8125rem',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        padding: '8px 16px',
                        borderRadius: 8,
                        transition: 'color 150ms ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                >
                    Sign out instead
                </motion.button>
            )}
        </motion.div>
    );
}
