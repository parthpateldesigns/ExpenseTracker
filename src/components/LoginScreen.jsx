import { useState } from 'react';
import { motion } from 'framer-motion';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

export default function LoginScreen() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGoogleSignIn = async () => {
        setLoading(true);
        setError('');
        try {
            await signInWithPopup(auth, googleProvider);
            // AppContext's onAuthStateChanged will handle the rest
        } catch (err) {
            console.error(err);
            setError('Sign-in failed. Please try again.');
            setLoading(false);
        }
    };

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
            }}
        >
            {/* Logo */}
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                style={{ marginBottom: '40px', textAlign: 'center' }}
            >
                <div style={{
                    width: 72, height: 72,
                    borderRadius: 20,
                    background: 'var(--accent-muted)',
                    border: '1px solid var(--border-active)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 20px',
                    fontSize: '2rem',
                    boxShadow: '0 8px 32px rgba(99, 140, 255, 0.2)',
                }}>
                    ₹
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--text-primary)' }}>
                    Balance
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', marginTop: '6px', letterSpacing: '-0.01em' }}>
                    Personal finance, across all your devices
                </div>
            </motion.div>

            {/* Card */}
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                className="card"
                style={{
                    width: '100%',
                    maxWidth: 380,
                    padding: '28px 24px',
                    textAlign: 'center',
                }}
            >
                <div style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '6px' }}>
                    Sign in to continue
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', marginBottom: '24px', lineHeight: 1.6 }}>
                    Your data syncs instantly across your phone, laptop, and office.
                </div>

                <button
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    id="google-signin-btn"
                    style={{
                        width: '100%',
                        padding: '12px 20px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-default)',
                        background: 'var(--bg-elevated)',
                        color: 'var(--text-primary)',
                        fontSize: '0.9375rem',
                        fontWeight: 600,
                        cursor: loading ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px',
                        opacity: loading ? 0.6 : 1,
                        transition: 'all 150ms ease',
                        fontFamily: 'inherit',
                    }}
                    onMouseEnter={(e) => { if (!loading) e.currentTarget.style.borderColor = 'var(--border-active)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-default)'; }}
                >
                    {/* Google Icon */}
                    {!loading ? (
                        <svg width="20" height="20" viewBox="0 0 48 48">
                            <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
                            <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
                            <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
                            <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
                        </svg>
                    ) : (
                        <div style={{
                            width: 20, height: 20, borderRadius: '50%',
                            border: '2px solid var(--border-default)',
                            borderTopColor: 'var(--accent)',
                            animation: 'spin 0.7s linear infinite',
                        }} />
                    )}
                    {loading ? 'Signing in…' : 'Continue with Google'}
                </button>

                {error && (
                    <div style={{ marginTop: '12px', fontSize: '0.8125rem', color: 'var(--expense)' }}>
                        {error}
                    </div>
                )}
            </motion.div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                style={{ marginTop: '24px', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', maxWidth: 300 }}
            >
                Your data is private and only accessible to you.
            </motion.div>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </motion.div>
    );
}
