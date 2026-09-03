import React, { useEffect, useState } from 'react';
import { supabase as sb } from '../lib/supabase';
import { DISCREPANCY_LABELS } from '../lib/config';
import { useAuth } from '../context/AuthContext';

interface DiscRow {
  id: string;
  transfer_id: string;
  product_id?: string;
  product_name: string;
  type: 'missing' | 'excess' | 'wrong_item' | 'damaged' | 'unknown_item';
  qty_diff: number;
  photo_proof_url: string;
  notes?: string;
  created_at: string;
  order_no: string;
}

export const DiscrepanciesAdmin: React.FC = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<DiscRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [decision, setDecision] = useState<Record<string, string>>({});

  useEffect(() => {
    const load = async () => {
      if (!sb) return;
      const { data, error } = await sb
        .from('transfer_discrepancies')
        .select('*, transfer_orders(order_no)')
        .order('created_at', { ascending: false });
      if (error) { console.error(error); setLoading(false); return; }
      setRows(
        (data || []).map((d: Record<string, unknown>) => ({
          id: d.id as string,
          transfer_id: d.transfer_id as string,
          product_id: d.product_id as string | undefined,
          product_name: (d.product_id as string) || '-',
          type: d.type as DiscRow['type'],
          qty_diff: d.qty_diff as number,
          photo_proof_url: d.photo_proof_url as string,
          notes: d.notes as string | undefined,
          created_at: d.created_at as string,
          order_no: (d.transfer_orders as Record<string, unknown> | null)?.order_no as string || '-',
        }))
      );
      setLoading(false);
    };
    void load();
  }, []);

  const decide = async (disc: DiscRow, action: 'approved' | 'rejected') => {
    if (!sb) return;
    const decisionFor = decision[disc.id] || 'adjust';
    const { error } = await sb
      .from('transfer_discrepancies')
      .update({ admin_status: action, resolved_by: user?.name || '', resolved_at: new Date().toISOString() })
      .eq('id', disc.id);
    if (error) { alert(`Gagal: ${error.message}`); return; }

    if (action === 'approved') {
      await sb.from('transfer_orders').update({ status: 'completed' }).eq('id', disc.transfer_id);
      if (decisionFor === 'backorder' && disc.product_id) {
        const { data: to } = await sb.from('transfer_orders').select('origin_branch_id, dest_branch_id').eq('id', disc.transfer_id).single();
        if (to) {
          await sb.from('backorders').insert({
            transfer_id: disc.transfer_id,
            product_id: disc.product_id,
            origin_branch_id: to.origin_branch_id,
            dest_branch_id: to.dest_branch_id,
            qty_owed: Math.abs(disc.qty_diff),
            status: 'pending',
          });
        }
      }
    }
    alert(action === 'approved' ? 'Approval Berhasil! Status pengiriman diperbarui.' : 'Laporan Selisih Ditolak!');
    setRows(rows.filter((r) => r.id !== disc.id));
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Panel Approval Selisih Barang (Karantina Admin)</h2>
        <p className="text-xs text-gray-500">
          Setiap laporan kurang/lebih/salah barang wajib dikonfirmasi Admin sebelum stok resmi disesuaikan
        </p>
      </div>

      <div className="space-y-3">
        {loading && <p className="py-4 text-center text-xs text-gray-400">Memuat laporan...</p>}
        {!loading && rows.length === 0 && (
          <div className="card p-8 text-center text-gray-400 text-xs">Tidak ada laporan selisih yang pending.</div>
        )}
        {rows.map((disc) => (
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
                <p className="font-bold text-gray-900">{disc.product_name}</p>
                <p className="font-bold text-danger-600">Selisih: {disc.qty_diff} PCS</p>
                <p className="text-gray-600 bg-gray-50 p-2 rounded border mt-2">
                  <span className="font-semibold">Catatan Lapangan:</span> "{disc.notes || '-'}"
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
                  <select
                    className="input-field text-xs"
                    value={decision[disc.id] || 'adjust'}
                    onChange={(e) => setDecision((p) => ({ ...p, [disc.id]: e.target.value }))}
                  >
                    <option value="backorder">Kirim Sisanya Besok (Catat Hutang Kirim)</option>
                    <option value="adjust">Terima Apa Adanya (Update Stok)</option>
                    <option value="reject">Tolak Laporan (Minta Hitung Ulang)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => void decide(disc, 'approved')}
                    className="btn-success w-full text-xs py-2"
                  >
                    Approve & Update Stok
                  </button>
                  <button
                    type="button"
                    onClick={() => void decide(disc, 'rejected')}
                    className="btn-outline w-full text-xs py-2 text-danger-600"
                  >
                    Tolak Laporan
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};