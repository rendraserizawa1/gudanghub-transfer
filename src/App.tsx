import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { TransfersList } from './pages/TransfersList';
import { CreateTransfer } from './pages/CreateTransfer';
import { ScanLoading } from './pages/ScanLoading';
import { ScanReceiving } from './pages/ScanReceiving';
import { DiscrepanciesAdmin } from './pages/DiscrepanciesAdmin';
import { ProductsMaster } from './pages/ProductsMaster';

function FullPageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <p className="text-sm text-gray-500">Memuat aplikasi...</p>
    </div>
  );
}

function LoginGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminOnly({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (user?.role !== 'superadmin') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export const App: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6">
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/dashboard"
            element={
              <LoginGate>
                <Dashboard />
              </LoginGate>
            }
          />

          <Route
            path="/transfers"
            element={
              <LoginGate>
                <TransfersList />
              </LoginGate>
            }
          />

          <Route
            path="/transfers/new"
            element={
              <LoginGate>
                <CreateTransfer />
              </LoginGate>
            }
          />

          <Route
            path="/scan-loading"
            element={
              <LoginGate>
                <ScanLoading />
              </LoginGate>
            }
          />

          <Route
            path="/scan-receiving"
            element={
              <LoginGate>
                <ScanReceiving />
              </LoginGate>
            }
          />

          <Route
            path="/discrepancies"
            element={
              <LoginGate>
                <AdminOnly>
                  <DiscrepanciesAdmin />
                </AdminOnly>
              </LoginGate>
            }
          />

          <Route
            path="/products"
            element={
              <LoginGate>
                <AdminOnly>
                  <ProductsMaster />
                </AdminOnly>
              </LoginGate>
            }
          />

          <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
        </Routes>
      </main>

      <footer className="border-t bg-white py-4 text-center text-xs text-gray-400">
        GudangHub Transfer &copy; 2026 PT Central Perabot Utama. Anti-Selisih Multi-Cabang.
      </footer>
    </div>
  );
};