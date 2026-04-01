import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

export default function LoginScreen() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);

    // Email/password fields
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleGoogleSignIn = async () => {
        setLoading(true);
        setError('');
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (err) {
            console.error(err);
            setError('Sign-in failed. Please try again.');
            setLoading(false);
        }
    };

    const handleEmailAuth = async (e) => {
        e.preventDefault();
        setError('');

        if (!email.trim() || !password.trim()) {
            setError('Please fill in all fields.');
            return;
        }

        if (isSignUp) {
            if (!displayName.trim()) {
                setError('Please enter your name.');
                return;
            }
            if (password.length < 6) {
                setError('Password must be at least 6 characters.');
                return;
            }
            if (password !== confirmPassword) {
                setError('Passwords do not match.');
                return;
            }
        }

        setLoading(true);
        try {
            if (isSignUp) {
                const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
                // Set the display name on the Firebase user profile
                await updateProfile(cred.user, { displayName: displayName.trim() });
            } else {
                await signInWithEmailAndPassword(auth, email.trim(), password);
            }
            // AppContext's onAuthStateChanged will handle the rest
        } catch (err) {
            console.error(err);
            setError(getFriendlyError(err.code));
            setLoading(false);
        }
    };

    const toggleMode = () => {
        setIsSignUp((prev) => !prev);
        setError('');
        setPassword('');
        setConfirmPassword('');
    };

    // ── Shared input style ──────────────────────────────────────────────────
    const inputStyle = {
        width: '100%',
        padding: '11px 14px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-default)',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        fontSize: '0.9375rem',
        fontFamily: 'inherit',
        outline: 'none',
        transition: 'border-color 150ms ease, box-shadow 150ms ease',
        boxSizing: 'border-box',
    };

    const inputFocusHandlers = {
        onFocus: (e) => {
            e.currentTarget.style.borderColor = 'var(--accent)';
            e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-muted)';
        },
        onBlur: (e) => {
            e.currentTarget.style.borderColor = 'var(--border-default)';
            e.currentTarget.style.boxShadow = 'none';
        },
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
                    {isSignUp ? 'Create your account' : 'Sign in to continue'}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', marginBottom: '24px', lineHeight: 1.6 }}>
                    {isSignUp
                        ? 'Set up your account to start tracking expenses.'
                        : 'Your data syncs instantly across your phone, laptop, and office.'}
                </div>

                {/* ── Google Sign-In Button ──────────────────────────────────── */}
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
                    {!loading ? (
                        <svg width="20" height="20" viewBox="0 0 48 48">
                            <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
                            <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
                            <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
                            <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
                        </svg>
                    ) : null}
                    Continue with Google
                </button>

                {/* ── Divider ────────────────────────────────────────────────── */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    margin: '20px 0',
                }}>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border-default)' }} />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        or
                    </span>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border-default)' }} />
                </div>

                {/* ── Email/Password Form ─────────────────────────────────────── */}
                <form onSubmit={handleEmailAuth} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <AnimatePresence mode="popLayout">
                        {isSignUp && (
                            <motion.div
                                key="name-field"
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                style={{ overflow: 'hidden' }}
                            >
                                <input
                                    type="text"
                                    id="login-display-name"
                                    placeholder="Full Name"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    disabled={loading}
                                    style={inputStyle}
                                    {...inputFocusHandlers}
                                    autoComplete="name"
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <input
                        type="email"
                        id="login-email"
                        placeholder="Email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        style={inputStyle}
                        {...inputFocusHandlers}
                        autoComplete="email"
                    />

                    <div style={{ position: 'relative' }}>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            id="login-password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                            style={{ ...inputStyle, paddingRight: '44px' }}
                            {...inputFocusHandlers}
                            autoComplete={isSignUp ? 'new-password' : 'current-password'}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((p) => !p)}
                            style={{
                                position: 'absolute',
                                right: '10px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '4px',
                                color: 'var(--text-tertiary)',
                                fontSize: '0.8125rem',
                                fontFamily: 'inherit',
                                display: 'flex',
                                alignItems: 'center',
                            }}
                            tabIndex={-1}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                            {showPassword ? (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                                    <line x1="1" y1="1" x2="23" y2="23" />
                                </svg>
                            ) : (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                    <circle cx="12" cy="12" r="3" />
                                </svg>
                            )}
                        </button>
                    </div>

                    <AnimatePresence mode="popLayout">
                        {isSignUp && (
                            <motion.div
                                key="confirm-field"
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                style={{ overflow: 'hidden' }}
                            >
                                <input
                                    type="password"
                                    id="login-confirm-password"
                                    placeholder="Confirm Password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    disabled={loading}
                                    style={inputStyle}
                                    {...inputFocusHandlers}
                                    autoComplete="new-password"
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <button
                        type="submit"
                        disabled={loading}
                        id="email-signin-btn"
                        style={{
                            width: '100%',
                            padding: '12px 20px',
                            borderRadius: 'var(--radius-md)',
                            border: 'none',
                            background: 'var(--accent)',
                            color: '#fff',
                            fontSize: '0.9375rem',
                            fontWeight: 600,
                            cursor: loading ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            opacity: loading ? 0.6 : 1,
                            transition: 'all 150ms ease',
                            fontFamily: 'inherit',
                        }}
                    >
                        {loading && (
                            <div style={{
                                width: 18, height: 18, borderRadius: '50%',
                                border: '2px solid rgba(255,255,255,0.3)',
                                borderTopColor: '#fff',
                                animation: 'spin 0.7s linear infinite',
                            }} />
                        )}
                        {loading
                            ? (isSignUp ? 'Creating account…' : 'Signing in…')
                            : (isSignUp ? 'Create Account' : 'Sign In')}
                    </button>
                </form>

                {/* ── Toggle Sign In / Sign Up ───────────────────────────────── */}
                <div style={{ marginTop: '16px', fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
                    {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                    <button
                        type="button"
                        onClick={toggleMode}
                        disabled={loading}
                        id="toggle-auth-mode-btn"
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--accent)',
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontSize: '0.8125rem',
                            fontFamily: 'inherit',
                            padding: 0,
                            textDecoration: 'none',
                        }}
                    >
                        {isSignUp ? 'Sign In' : 'Sign Up'}
                    </button>
                </div>

                {/* ── Error Message ──────────────────────────────────────────── */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            style={{ marginTop: '12px', fontSize: '0.8125rem', color: 'var(--expense)' }}
                        >
                            {error}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
                style={{
                    marginTop: '32px',
                    maxWidth: 340,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                }}
            >
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center' }}>
                    How Balance works
                </div>
                {[
                    { icon: '✏️', text: 'Manually log income & expenses — no bank login needed' },
                    { icon: '🔒', text: 'PIN-protected & your data stays private to you' },
                    { icon: '☁️', text: 'Syncs automatically across all your devices' },
                    { icon: '📊', text: 'Charts, filters, and CSV/PDF export built in' },
                ].map((item, i) => (
                    <div key={i} style={{
                        display: 'flex', alignItems: 'flex-start', gap: '10px',
                        fontSize: '0.8125rem', color: 'var(--text-tertiary)', lineHeight: 1.5,
                    }}>
                        <span style={{ flexShrink: 0, fontSize: '0.9rem' }}>{item.icon}</span>
                        <span>{item.text}</span>
                    </div>
                ))}
            </motion.div>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </motion.div>
    );
}

// ── Friendly Firebase error messages ────────────────────────────────────────────
function getFriendlyError(code) {
    switch (code) {
        case 'auth/invalid-email':
            return 'Please enter a valid email address.';
        case 'auth/user-disabled':
            return 'This account has been disabled.';
        case 'auth/user-not-found':
            return 'No account found with this email.';
        case 'auth/wrong-password':
            return 'Incorrect password. Please try again.';
        case 'auth/invalid-credential':
            return 'Invalid email or password. Please try again.';
        case 'auth/email-already-in-use':
            return 'An account with this email already exists. Try signing in.';
        case 'auth/weak-password':
            return 'Password is too weak. Use at least 6 characters.';
        case 'auth/too-many-requests':
            return 'Too many attempts. Please try again later.';
        case 'auth/network-request-failed':
            return 'Network error. Check your connection.';
        default:
            return 'Sign-in failed. Please try again.';
    }
}
