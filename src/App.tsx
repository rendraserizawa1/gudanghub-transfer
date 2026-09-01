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

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6">
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/transfers"
            element={
              <ProtectedRoute>
                <TransfersList />
              </ProtectedRoute>
            }
          />

          <Route
            path="/transfers/new"
            element={
              <ProtectedRoute>
                <CreateTransfer />
              </ProtectedRoute>
            }
          />

          <Route
            path="/scan-loading"
            element={
              <ProtectedRoute>
                <ScanLoading />
              </ProtectedRoute>
            }
          />

          <Route
            path="/scan-receiving"
            element={
              <ProtectedRoute>
                <ScanReceiving />
              </ProtectedRoute>
            }
          />

          <Route
            path="/discrepancies"
            element={
              <ProtectedRoute>
                <DiscrepanciesAdmin />
              </ProtectedRoute>
            }
          />

          <Route
            path="/products"
            element={
              <ProtectedRoute>
                <ProductsMaster />
              </ProtectedRoute>
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
