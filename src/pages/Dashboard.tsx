import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchTransfers, type TransferRecord } from '../lib/supabase';
import { STATUS_LABELS, STATUS_COLORS, getBranchName } from '../lib/config';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [transfers, setTransfers] = useState<TransferRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const branchIds =
          user?.role === 'superadmin' ? null : user?.branch_id ? [user.branch_id] : [];
        const data = await fetchTransfers(branchIds);
        setTransfers(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [user]);

  const pendingDiscrepancies = transfers.filter((t) => t.status === 'discrepancy');
  const inTransitCount = transfers.filter((t) => t.status === 'in_transit').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Dashboard Operasional</h2>
          <p className="text-xs text-gray-500">
            Selamat datang, <span className="font-semibold text-gray-800">{user?.name}</span> ({user?.role})
            {user?.branch_id ? ` • ${getBranchName(user.branch_id)}` : ''}
          </p>
        </div>

        <Link to="/transfers/new" className="btn-primary text-xs">
          + Buat Surat Jalan Baru
        </Link>
      </div>

      {pendingDiscrepancies.length > 0 && (
        <div className="rounded-xl border border-danger-500/20 bg-danger-500/5 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 rounded-full bg-danger-500 animate-pulse" />
              <h3 className="text-sm font-bold text-danger-600">Peringatan: Laporan Selisih Menunggu Approval Admin</h3>
            </div>
            {user?.role === 'superadmin' && (
              <Link to="/discrepancies" className="text-xs font-bold text-danger-600 underline">
                Lihat Semua ({pendingDiscrepancies.length})
              </Link>
            )}
          </div>
          <p className="text-xs text-gray-600">
            Ada barang kurang / lebih / keliru saat bongkar di cabang. Stok belum berpindah sebelum Admin menyetujui.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-xs text-gray-500">Total Pengiriman</p>
          <p className="text-2xl font-black text-gray-900 mt-1">{loading ? '…' : transfers.length}</p>
        </div>

        <div className="card">
          <p className="text-xs text-gray-500">Dalam Perjalanan</p>
          <p className="text-2xl font-black text-warning-600 mt-1">{loading ? '…' : inTransitCount}</p>
        </div>

        <div className="card">
          <p className="text-xs text-gray-500">Ada Selisih (Karantina)</p>
          <p className="text-2xl font-black text-danger-600 mt-1">{loading ? '…' : pendingDiscrepancies.length}</p>
        </div>

        <div className="card">
          <p className="text-xs text-gray-500">Mode Sistem</p>
          <p className="text-sm font-bold text-success-600 mt-2">✓ Online / Offline Ready</p>
        </div>
      </div>

      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">Daftar Pengiriman Terbaru</h3>
          <Link to="/transfers" className="text-xs font-semibold text-brand-600 hover:underline">
            Lihat Semua →
          </Link>
        </div>

        <div className="divide-y overflow-x-auto">
          {loading && <p className="py-4 text-center text-xs text-gray-400">Memuat data...</p>}
          {!loading && transfers.length === 0 && (
            <p className="py-4 text-center text-xs text-gray-400">Belum ada pengiriman.</p>
          )}
          {transfers.map((t) => (
            <div key={t.id} className="py-3 flex items-center justify-between gap-4 min-w-[500px]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-gray-900">{t.order_no}</span>
                  <span className={`badge ${STATUS_COLORS[t.status as keyof typeof STATUS_COLORS] || 'badge-info'}`}>
                    {STATUS_LABELS[t.status as keyof typeof STATUS_LABELS] || t.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {getBranchName(t.origin_branch_id)} → {getBranchName(t.dest_branch_id)}
                </p>
              </div>

              <div className="text-right">
                <p className="text-xs font-medium text-gray-700">{t.driver_name} ({t.truck_plate})</p>
                <p className="text-[10px] text-gray-400">{t.created_at}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};