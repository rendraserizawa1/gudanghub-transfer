import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LogOut, Sun, Moon } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { useThemeWeb } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { TransfersList } from './pages/TransfersList';
import { CreateTransfer } from './pages/CreateTransfer';
import { ScanLoading } from './pages/ScanLoading';
import { ScanReceiving } from './pages/ScanReceiving';
import { DiscrepanciesAdmin } from './pages/DiscrepanciesAdmin';
import { ProductsMaster } from './pages/ProductsMaster';
import { UsersAdmin } from './pages/UsersAdmin';
import { PasswordChange } from './pages/PasswordChange';
import { ReportsWeb } from './pages/ReportsWeb';
import { AuditTrail } from './pages/AuditTrail';

function FullPageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-[#0A0E1A]">
      <p className="text-sm text-gray-500 dark:text-gray-400">Memuat aplikasi...</p>
    </div>
  );
}

function AdminOnly({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export const App: React.FC = () => {
  const { user, loading, logout } = useAuth();
  const { mode, toggle } = useThemeWeb();

  if (loading) return <FullPageLoader />;
  if (!user) return <Login />;

  const handleLogout = () => {
    if (window.confirm('Keluar dari akun ini dan kembali ke halaman login?')) {
      void logout();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0A0E1A] flex flex-col font-sans transition-colors">
      <header className="sticky top-0 z-30 border-b border-gray-200 dark:border-[#232840] bg-white/95 dark:bg-[#141828]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0A0E1A] dark:bg-[#FF6B00] shadow-sm">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#FF6B00" className="dark:stroke-white" strokeWidth="2.4" strokeLinecap="round">
                <rect x="6" y="3" width="12" height="18" rx="2" />
                <path d="M9 8h6M9 12h6M9 16h4" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 dark:text-white leading-tight">MY REPORT</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">PT Central Perabot Utama</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={toggle} className="rounded-lg p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#232840]" title={mode === 'dark' ? 'Mode terang' : 'Mode gelap'}>
              {mode === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            <div className="hidden sm:block text-right mr-1">
              <p className="text-xs font-semibold text-gray-900 dark:text-white">{user.name}</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 capitalize">{user.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-lg border border-red-200 dark:border-red-900/50 px-2.5 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
        <Navbar />
      </header>

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6">
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/transfers" element={<TransfersList />} />
          <Route path="/transfers/new" element={<CreateTransfer />} />
          <Route path="/scan-loading" element={<ScanLoading />} />
          <Route path="/scan-receiving" element={<ScanReceiving />} />
          <Route path="/reports" element={<ReportsWeb />} />
          <Route path="/password" element={<PasswordChange />} />
          <Route
            path="/discrepancies"
            element={<AdminOnly><DiscrepanciesAdmin /></AdminOnly>}
          />
          <Route
            path="/products"
            element={<AdminOnly><ProductsMaster /></AdminOnly>}
          />
          <Route
            path="/audit"
            element={<AdminOnly><AuditTrail /></AdminOnly>}
          />
          <Route
            path="/users"
            element={<AdminOnly><UsersAdmin /></AdminOnly>}
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>

      <footer className="border-t border-gray-200 dark:border-[#232840] bg-white dark:bg-[#141828] py-4 text-center text-xs text-gray-400 dark:text-gray-500">
        MY REPORT &copy; 2026 PT Central Perabot Utama. Anti-Selisih Multi-Cabang.
      </footer>
    </div>
  );
};