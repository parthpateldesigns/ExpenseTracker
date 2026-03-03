import { AnimatePresence, motion } from 'framer-motion';
import { AppProvider, useApp } from './context/AppContext';
import BottomNav from './components/BottomNav';
import Dashboard from './pages/Dashboard';
import Monthly from './pages/Monthly';
import Accounts from './pages/Accounts';
import Charts from './pages/Charts';
import LoginScreen from './components/LoginScreen';
import PinScreen from './components/PinScreen';
import './index.css';

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast() {
  const { toast } = useApp();
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          className="toast"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2 }}
        >
          {toast}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Loading Splash ───────────────────────────────────────────────────────────
function LoadingSplash() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
        gap: '20px',
      }}
    >
      <div style={{
        width: 56, height: 56,
        borderRadius: 16,
        background: 'var(--accent-muted)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.5rem',
        border: '1px solid var(--border-active)',
      }}>
        ₹
      </div>
      <div style={{
        width: 24, height: 24, borderRadius: '50%',
        border: '2.5px solid var(--border-default)',
        borderTopColor: 'var(--accent)',
        animation: 'spin 0.7s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </motion.div>
  );
}

// ─── App content (only rendered when authenticated) ───────────────────────────
function AppContent() {
  const { activeTab, user, loading, hasPin, pinLocked, pinChecked } = useApp();

  // 1. Still determining auth state
  if (user === undefined) return <LoadingSplash />;

  // 2. Not logged in → Google sign-in
  if (user === null) return <LoginScreen />;

  // 3. Logged in but PIN not yet checked
  if (!pinChecked) return <LoadingSplash />;

  // 4. No PIN set yet → prompt to create one
  if (hasPin === false) return <PinScreen mode="setup" />;

  // 5. Has PIN and app is locked → unlock screen
  if (pinLocked) return <PinScreen mode="unlock" />;

  // 6. Unlocked but data still loading from Firestore
  if (loading) return <LoadingSplash />;

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -8 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          style={{ flex: 1 }}
        >
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'monthly' && <Monthly />}
          {activeTab === 'charts' && <Charts />}
          {activeTab === 'accounts' && <Accounts />}
        </motion.div>
      </AnimatePresence>
      <BottomNav />
      <Toast />
    </>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
