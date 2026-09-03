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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', color: '#fff' }}>
      <p style={{ fontSize: 14, color: '#888' }}>Memuat aplikasi...</p>
    </div>
  );
}

function AdminOnly({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (user?.role !== 'superadmin') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export const App: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) return <FullPageLoader />;

  if (!user) return <Login />;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6">
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/transfers" element={<TransfersList />} />
          <Route path="/transfers/new" element={<CreateTransfer />} />
          <Route path="/scan-loading" element={<ScanLoading />} />
          <Route path="/scan-receiving" element={<ScanReceiving />} />
          <Route
            path="/discrepancies"
            element={
              <AdminOnly>
                <DiscrepanciesAdmin />
              </AdminOnly>
            }
          />
          <Route
            path="/products"
            element={
              <AdminOnly>
                <ProductsMaster />
              </AdminOnly>
            }
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>

      <footer className="border-t bg-white py-4 text-center text-xs text-gray-400">
        GudangHub Transfer &copy; 2026 PT Central Perabot Utama. Anti-Selisih Multi-Cabang.
      </footer>
    </div>
  );
};