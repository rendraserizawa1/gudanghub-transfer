import React, { useState } from 'react';
import { DEMO_TRANSFERS } from '../lib/demoData';
import { STATUS_LABELS, STATUS_COLORS, BRANCHES } from '../lib/config';
import { Link } from 'react-router-dom';

export const TransfersList: React.FC = () => {
  const [transfers] = useState(DEMO_TRANSFERS);

  const getBranchName = (id: string) => BRANCHES.find((b) => b.id === id)?.name || id;

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
        {transfers.map((t) => (
          <div key={t.id} className="card hover:border-brand-300 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-brand-700">{t.order_no}</span>
                  <span className={`badge ${STATUS_COLORS[t.status]}`}>{STATUS_LABELS[t.status]}</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  <span className="font-semibold">{getBranchName(t.origin_branch_id)}</span> →{' '}
                  <span className="font-semibold">{getBranchName(t.dest_branch_id)}</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                {t.status === 'in_transit' && (
                  <Link to={`/scan-receiving?id=${t.id}`} className="btn-success text-xs py-1.5">
                    Scan Bongkar (Kefa)
                  </Link>
                )}
                {t.status === 'loading' && (
                  <Link to={`/scan-loading?id=${t.id}`} className="btn-primary text-xs py-1.5">
                    Scan Muat (El Tari)
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
