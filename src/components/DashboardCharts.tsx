import React, { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import { fetchTransfers, type TransferRecord } from '../lib/supabase';
import { getBranchName, STATUS_LABELS } from '../lib/config';
import { useAuth } from '../context/AuthContext';

const STATUS_COLORS: Record<string, string> = {
  completed: '#22c55e',
  in_transit: '#f59e0b',
  loading: '#eab308',
  receiving: '#3b82f6',
  discrepancy: '#ef4444',
  draft: '#94a3b8',
  cancelled: '#6b7280',
};

export const DashboardCharts: React.FC = () => {
  const { user } = useAuth();
  const [transfers, setTransfers] = useState<TransferRecord[]>([]);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  useEffect(() => {
    const sync = () => setIsDark(document.documentElement.classList.contains('dark'));
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => mo.disconnect();
  }, []);

  useEffect(() => {
    const ids = user?.role === 'admin' ? null : user?.branch_id ? [user.branch_id] : [];
    void fetchTransfers(ids).then(setTransfers).catch(console.error);
  }, [user]);

  const monthly = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of transfers) {
      const d = new Date(t.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      map.set(key, (map.get(key) || 0) + 1);
    }
    return [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([m, n]) => ({ bulan: m, jumlah: n }));
  }, [transfers]);

  const statusPie = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of transfers) map.set(t.status, (map.get(t.status) || 0) + 1);
    return [...map.entries()].map(([s, n]) => ({ name: STATUS_LABELS[s as keyof typeof STATUS_LABELS] || s, value: n, key: s }));
  }, [transfers]);

  const perToko = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of transfers.filter((x) => x.status === 'discrepancy')) {
      const key = getBranchName(t.dest_branch_id);
      map.set(key, (map.get(key) || 0) + 1);
    }
    return [...map.entries()].map(([toko, n]) => ({ toko: toko.length > 18 ? toko.slice(0, 17) + '…' : toko, selisih: n }));
  }, [transfers]);

  const grid = isDark ? '#232840' : '#e5e7eb';
  const axis = isDark ? '#94a3b8' : '#64748b';
  const tooltipStyle = { backgroundColor: isDark ? '#141828' : '#fff', border: `1px solid ${grid}`, borderRadius: 8, fontSize: 12, color: isDark ? '#f8fafc' : '#0f172a' };

  if (transfers.length === 0) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="card dark:bg-[#141828] dark:border-[#232840]">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-1.5">
          <TrendingUp size={15} className="text-orange-500" /> Pengiriman per Bulan
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={monthly} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={grid} />
            <XAxis dataKey="bulan" tick={{ fontSize: 11, fill: axis }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: axis }} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: isDark ? '#ffffff08' : '#00000008' }} />
            <Bar dataKey="jumlah" fill="#FF6B00" radius={[6, 6, 0, 0]} maxBarSize={44} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card dark:bg-[#141828] dark:border-[#232840]">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">Status Pengiriman</h3>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={statusPie} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
              {statusPie.map((e) => <Cell key={e.key} fill={STATUS_COLORS[e.key] || '#94a3b8'} />)}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 11, color: axis }} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {perToko.length > 0 && (
        <div className="card dark:bg-[#141828] dark:border-[#232840] lg:col-span-2">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">Laporan Selisih per Toko Tujuan</h3>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={perToko} layout="vertical" margin={{ top: 5, right: 20, left: 60, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={grid} horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: axis }} />
              <YAxis type="category" dataKey="toko" width={140} tick={{ fontSize: 11, fill: axis }} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: isDark ? '#ffffff08' : '#00000008' }} />
              <Bar dataKey="selisih" fill="#ef4444" radius={[0, 6, 6, 0]} maxBarSize={26} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};