import { AnimatePresence, motion } from 'framer-motion';
import { AppProvider, useApp } from './context/AppContext';
import BottomNav from './components/BottomNav';
import Dashboard from './pages/Dashboard';
import Monthly from './pages/Monthly';
import Accounts from './pages/Accounts';
import './index.css';

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

function AppContent() {
  const { activeTab } = useApp();

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
          {activeTab === 'accounts' && <Accounts />}
        </motion.div>
      </AnimatePresence>
      <BottomNav />
      <Toast />
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
