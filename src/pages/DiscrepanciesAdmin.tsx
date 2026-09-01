import React, { useState } from 'react';
import { DEMO_TRANSFERS } from '../lib/demoData';
import { DISCREPANCY_LABELS } from '../lib/config';

export const DiscrepanciesAdmin: React.FC = () => {
  const [transfers] = useState(DEMO_TRANSFERS);

  const discrepanciesList = transfers.flatMap((t) =>
    (t.discrepancies || []).map((d) => ({ ...d, order_no: t.order_no }))
  );

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Panel Approval Selisih Barang (Karantina Admin)</h2>
        <p className="text-xs text-gray-500">
          Setiap laporan kurang/lebih/salah barang wajib dikonfirmasi Admin sebelum stok resmi disesuaikan
        </p>
      </div>

      <div className="space-y-3">
        {discrepanciesList.length === 0 ? (
          <div className="card p-8 text-center text-gray-400 text-xs">Tidak ada laporan selisih yang pending.</div>
        ) : (
          discrepanciesList.map((disc) => (
            <div key={disc.id} className="card space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-brand-700">{disc.order_no}</span>
                  <span className="badge badge-danger">{DISCREPANCY_LABELS[disc.type]}</span>
                </div>
                <span className="text-[10px] text-gray-400">{disc.created_at}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1 text-xs">
                  <p className="font-bold text-gray-900">
                    [{disc.product?.brand}] {disc.product?.name}
                  </p>
                  <p className="text-gray-500">Ukuran: {disc.product?.size} | Warna: {disc.product?.color}</p>
                  <p className="font-bold text-danger-600">Selisih: {disc.qty_diff} {disc.product?.unit}</p>
                  <p className="text-gray-600 bg-gray-50 p-2 rounded border mt-2">
                    <span className="font-semibold">Catatan Lapangan:</span> "{disc.notes}"
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-semibold text-gray-500 mb-1">Foto Bukti Fisik Lapangan:</p>
                  <img
                    src={disc.photo_proof_url}
                    alt="Bukti Selisih"
                    className="w-full h-32 object-cover rounded-lg border"
                  />
                </div>

                <div className="flex flex-col justify-between space-y-2 border-l pl-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Keputusan Admin:</label>
                    <select className="input-field text-xs">
                      <option value="backorder">Kirim Sisanya Besok (Catat Hutang Kirim)</option>
                      <option value="adjust">Terima Apa Adanya (Update Stok)</option>
                      <option value="reject">Tolak Laporan (Minta Hitung Ulang)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => alert('Approval Berhasil! Stok dan status pengiriman diperbarui.')}
                      className="btn-success w-full text-xs py-2"
                    >
                      Approve & Update Stok
                    </button>
                    <button
                      type="button"
                      onClick={() => alert('Laporan Selisih Ditolak!')}
                      className="btn-outline w-full text-xs py-2 text-danger-600"
                    >
                      Tolak Laporan
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
