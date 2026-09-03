import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchTransfers, type TransferRecord } from '../lib/supabase';
import { STATUS_LABELS, STATUS_COLORS, getBranchName } from '../lib/config';
import { Link } from 'react-router-dom';

export const TransfersList: React.FC = () => {
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Daftar Surat Jalan (Transfer Order)</h2>
          <p className="text-xs text-gray-500">Semua riwayat dan antrean pengiriman barang antar cabang</p>
        </div>

        <Link to="/transfers/new" className="btn-primary text-xs">
          + Buat Surat Jalan Baru
        </Link>
      </div>

      <div className="space-y-3">
        {loading && <p className="py-4 text-center text-xs text-gray-400">Memuat data...</p>}
        {!loading && transfers.length === 0 && (
          <div className="card p-8 text-center text-xs text-gray-400">Belum ada surat jalan.</div>
        )}
        {transfers.map((t) => (
          <div key={t.id} className="card hover:border-brand-300 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-brand-700">{t.order_no}</span>
                  <span className={`badge ${STATUS_COLORS[t.status as keyof typeof STATUS_COLORS] || 'badge-info'}`}>
                    {STATUS_LABELS[t.status as keyof typeof STATUS_LABELS] || t.status}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  <span className="font-semibold">{getBranchName(t.origin_branch_id)}</span> →{' '}
                  <span className="font-semibold">{getBranchName(t.dest_branch_id)}</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                {t.status === 'in_transit' && user?.role !== 'checker' && (
                  <Link to={`/scan-receiving?id=${t.id}`} className="btn-success text-xs py-1.5">
                    Scan Bongkar
                  </Link>
                )}
                {t.status === 'loading' && user?.role !== 'superadmin' && (
                  <Link to={`/scan-loading?id=${t.id}`} className="btn-primary text-xs py-1.5">
                    Scan Muat
                  </Link>
                )}
              </div>
            </div>

            <div className="pt-3 text-xs text-gray-500 grid grid-cols-2 sm:grid-cols-3 gap-2">
              <div>Sopir: <span className="font-semibold text-gray-800">{t.driver_name}</span></div>
              <div>Plat Mobil: <span className="font-semibold text-gray-800">{t.truck_plate}</span></div>
              <div>Dibuat: <span className="font-semibold text-gray-800">{t.created_at}</span></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};