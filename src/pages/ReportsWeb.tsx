import React, { useEffect, useMemo, useState } from 'react';
import { Download, FileText, Calendar, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchTransfers, type TransferRecord } from '../lib/supabase';
import { STATUS_LABELS, STATUS_COLORS, getBranchName, BRANCHES } from '../lib/config';
import { downloadPDF, downloadXLSX } from '../lib/export';

export const ReportsWeb: React.FC = () => {
  const { user } = useAuth();
  const [transfers, setTransfers] = useState<TransferRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [status, setStatus] = useState('all');
  const [branch, setBranch] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const ids = user?.role === 'admin' ? null : user?.branch_id ? [user.branch_id] : [];
        setTransfers(await fetchTransfers(ids));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [user]);

  const filtered = useMemo(() => {
    return transfers.filter((t) => {
      if (status !== 'all' && t.status !== status) return false;
      if (branch !== 'all' && t.origin_branch_id !== branch && t.dest_branch_id !== branch) return false;
      if (from && new Date(t.created_at) < new Date(from)) return false;
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59);
        if (new Date(t.created_at) > end) return false;
      }
      if (search && !t.order_no.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [transfers, status, branch, from, to, search]);

  const stats = useMemo(() => {
    const today = new Date().toDateString();
    return {
      total: filtered.length,
      selesai: filtered.filter((t) => t.status === 'completed').length,
      perjalanan: filtered.filter((t) => t.status === 'in_transit').length,
      selisih: filtered.filter((t) => t.status === 'discrepancy').length,
      hariIni: transfers.filter((t) => new Date(t.created_at).toDateString() === today).length,
    };
  }, [filtered, transfers]);

  const inputCls = 'input-field dark:bg-[#141828] dark:border-[#232840] dark:text-gray-200';

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Laporan</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">Rekap pengiriman dengan filter tanggal, cabang, dan status</p>
        </div>
        {filtered.length > 0 && (
          <div className="flex gap-2">
            <button onClick={() => downloadPDF(filtered, `MY REPORT — Laporan ${from || 'awal'} s/d ${to || 'sekarang'}`)} className="btn-outline dark:bg-[#141828] dark:border-[#232840] dark:text-gray-200 text-xs flex items-center gap-1.5">
              <FileText size={14} /> PDF
            </button>
            <button onClick={() => downloadXLSX(filtered)} className="btn-outline dark:bg-[#141828] dark:border-[#232840] dark:text-gray-200 text-xs flex items-center gap-1.5">
              <Download size={14} /> XLSX
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {([['Total', stats.total, 'text-gray-900 dark:text-white'], ['Hari Ini', stats.hariIni, 'text-orange-600'], ['Selesai', stats.selesai, 'text-success-600'], ['Perjalanan', stats.perjalanan, 'text-warning-600'], ['Selisih', stats.selisih, 'text-danger-600']] as const).map(([label, val, color]) => (
          <div key={label} className="card dark:bg-[#141828] dark:border-[#232840]">
            <p className="text-[11px] text-gray-500 dark:text-gray-400">{label}</p>
            <p className={`text-2xl font-black ${color}`}>{val}</p>
          </div>
        ))}
      </div>

      <div className="card dark:bg-[#141828] dark:border-[#232840] space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 flex items-center gap-1 mb-1"><Calendar size={12} /> Dari</label>
            <input type="date" className={inputCls} value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1 block">Sampai</label>
            <input type="date" className={inputCls} value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1 block">Status</label>
            <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">Semua</option>
              {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1 block">Cabang</label>
            <select className={inputCls} value={branch} onChange={(e) => setBranch(e.target.value)}>
              <option value="all">Semua</option>
              {BRANCHES.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className={`${inputCls} pl-9`} placeholder="Cari nomor surat jalan..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="card dark:bg-[#141828] dark:border-[#232840] space-y-1">
        {loading && <p className="py-4 text-center text-xs text-gray-400">Memuat...</p>}
        {!loading && filtered.length === 0 && <p className="py-6 text-center text-xs text-gray-400 dark:text-gray-500">Tidak ada data untuk filter ini.</p>}
        {filtered.map((t) => (
          <div key={t.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-[#1d2238] last:border-0">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-gray-900 dark:text-white">{t.order_no}</span>
                <span className={`badge ${STATUS_COLORS[t.status as keyof typeof STATUS_COLORS] || 'badge-info'}`}>
                  {STATUS_LABELS[t.status as keyof typeof STATUS_LABELS] || t.status}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {getBranchName(t.origin_branch_id)} → {getBranchName(t.dest_branch_id)} • {t.driver_name} ({t.truck_plate})
              </p>
            </div>
            <span className="text-[10px] text-gray-400">{new Date(t.created_at).toLocaleString('id-ID')}</span>
          </div>
        ))}
      </div>
    </div>
  );
};