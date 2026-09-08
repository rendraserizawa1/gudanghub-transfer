import React, { useCallback, useEffect, useState } from 'react';
import { History } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ADMIN_API_URL } from '../lib/config';
import { supabase } from '../lib/supabase';

interface LogEntry {
  ts: string;
  username: string;
  name: string;
  role: string;
  action: string;
  detail: string;
}

const todayISO = () => new Date().toISOString().slice(0, 10);

export const AuditTrail: React.FC = () => {
  const { user } = useAuth();
  const [date, setDate] = useState(todayISO());
  const [rows, setRows] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const token = useCallback(async () => {
    if (!supabase) return '';
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || '';
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const t = await token();
      const res = await fetch(`${ADMIN_API_URL}/log?date=${date}`, { headers: { Authorization: `Bearer ${t}` } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setRows(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'gagal memuat');
    } finally {
      setLoading(false);
    }
  }, [date, token]);

  useEffect(() => { void load(); }, [load]);

  if (user?.role !== 'admin') return <div className="card dark:bg-[#141828] dark:border-[#232840] p-8 text-center text-xs text-gray-400">Khusus admin.</div>;

  const inputCls = 'input-field dark:bg-[#0A0E1A] dark:border-[#232840] dark:text-gray-200';
  const ACTION_COLORS: Record<string, string> = {
    create_transfer: 'badge-info', approve_discrepancy: 'badge-success', reject_discrepancy: 'badge-danger',
    create_user: 'badge-success', edit_user: 'badge-warning', delete_user: 'badge-danger',
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <History size={19} className="text-orange-500" /> Audit Trail
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">Riwayat aktivitas penting semua pengguna sistem</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} />
          <button onClick={() => void load()} className="btn-outline dark:bg-[#141828] dark:border-[#232840] dark:text-gray-300 text-xs">Muat Ulang</button>
        </div>
      </div>

      {error && <div className="card dark:bg-[#141828] dark:border-[#232840] border-danger-500/30 text-xs text-danger-600">Error: {error}</div>}

      <div className="card dark:bg-[#141828] dark:border-[#232840] space-y-1">
        {loading && <p className="py-4 text-center text-xs text-gray-400">Memuat log...</p>}
        {!loading && rows.length === 0 && (
          <p className="py-6 text-center text-xs text-gray-400 dark:text-gray-500">Tidak ada aktivitas pada tanggal {date}.</p>
        )}
        {rows.map((r, i) => (
          <div key={i} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-gray-100 dark:border-[#1d2238] last:border-0">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-gray-900 dark:text-white">{r.username}</span>
                <span className={`badge ${ACTION_COLORS[r.action] || 'badge-info'}`}>{r.action}</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{r.detail}</p>
            </div>
            <span className="text-[10px] text-gray-400">{new Date(r.ts).toLocaleTimeString('id-ID')}</span>
          </div>
        ))}
      </div>
    </div>
  );
};