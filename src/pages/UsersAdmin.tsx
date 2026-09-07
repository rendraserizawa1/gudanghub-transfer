import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ADMIN_API_URL, BRANCHES } from '../lib/config';

interface ManagedUser {
  id: string;
  email: string;
  username: string;
  name: string;
  role: 'admin' | 'toko_cabang';
  branch_id: string | null;
  nama_toko: string;
  active: boolean;
  perms: Record<string, boolean>;
  created_at: string;
}

const PERM_LABELS: Record<string, string> = {
  scan: 'Scan Barcode',
  foto: 'Foto Bukti',
  lapor: 'Lapor Selisih',
  lihat_semua: 'Lihat Semua Cabang',
  download: 'Download Rekap',
  kelola_user: 'Kelola User',
};

const EMPTY_FORM = {
  username: '', password: '', role: 'toko_cabang' as 'admin' | 'toko_cabang',
  branch_id: 'CB000', nama_toko: '',
  perms: { scan: true, foto: true, lapor: true, lihat_semua: false, download: false, kelola_user: false } as Record<string, boolean>,
};

export const UsersAdmin: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ManagedUser | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const token = useCallback(async () => {
    const { supabase } = await import('../lib/supabase');
    const { data } = await supabase!.auth.getSession();
    return data.session?.access_token || '';
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const t = await token();
      const res = await fetch(`${ADMIN_API_URL}/users`, { headers: { Authorization: `Bearer ${t}` } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setUsers(await res.json());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'gagal memuat');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { void load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setShowForm(true); };

  const openEdit = (u: ManagedUser) => {
    setEditing(u);
    setForm({
      username: u.username, password: '', role: u.role,
      branch_id: u.branch_id || 'CB000', nama_toko: u.nama_toko || u.name,
      perms: { scan: false, foto: false, lapor: false, lihat_semua: false, download: false, kelola_user: false, ...u.perms },
    });
    setShowForm(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const t = await token();
      if (editing) {
        const body: Record<string, unknown> = {
          username: form.username, role: form.role,
          branch_id: form.role === 'admin' ? null : form.branch_id,
          nama_toko: form.nama_toko, active: editing.active, perms: form.perms,
        };
        if (form.password) body.password = form.password;
        const res = await fetch(`${ADMIN_API_URL}/users/${editing.id}`, {
          method: 'PATCH', headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(`update gagal: HTTP ${res.status}`);
      } else {
        const res = await fetch(`${ADMIN_API_URL}/users`, {
          method: 'POST', headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: form.username, password: form.password, role: form.role,
            branch_id: form.role === 'admin' ? null : form.branch_id,
            nama_toko: form.nama_toko || form.username, perms: form.perms,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.msg || data.error || `buat gagal: HTTP ${res.status}`);
        }
      }
      setShowForm(false);
      setEditing(null);
      void load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (u: ManagedUser) => {
    const t = await token();
    await fetch(`${ADMIN_API_URL}/users/${u.id}`, {
      method: 'PATCH', headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !u.active }),
    });
    void load();
  };

  const remove = async (u: ManagedUser) => {
    if (!confirm(`Hapus akun "${u.username}"? Tindakan permanen.`)) return;
    const t = await token();
    const res = await fetch(`${ADMIN_API_URL}/users/${u.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${t}` } });
    if (!res.ok) { alert('Gagal menghapus'); return; }
    void load();
  };

  if (user?.role !== 'admin') return <div className="card p-8 text-center text-xs text-gray-400">Khusus admin.</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Kelola User & Akses</h2>
          <p className="text-xs text-gray-500">Buat akun, atur role, cabang, password, dan batasan izin per user</p>
        </div>
        <button type="button" onClick={openCreate} className="btn-primary text-xs">+ Buat Akun Baru</button>
      </div>

      {error && <div className="card border-danger-500/30 text-xs text-danger-600">Error: {error}</div>}

      {showForm && (
        <form onSubmit={save} className="card space-y-3">
          <h3 className="text-sm font-bold text-gray-900">{editing ? `Edit: ${editing.username}` : 'Buat Akun Baru'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="text-xs">
              <span className="font-semibold text-gray-700">Username *</span>
              <input className="input-field mt-1" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required disabled={!!editing} />
            </label>
            <label className="text-xs">
              <span className="font-semibold text-gray-700">{editing ? 'Password Baru (opsional)' : 'Password *'}</span>
              <input className="input-field mt-1" type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!editing} placeholder={editing ? 'biarkan kosong = tidak diubah' : ''} />
            </label>
            <label className="text-xs">
              <span className="font-semibold text-gray-700">Role</span>
              <select className="input-field mt-1" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as 'admin' | 'toko_cabang' })}>
                <option value="toko_cabang">Toko Cabang</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <label className="text-xs">
              <span className="font-semibold text-gray-700">Cabang / Toko</span>
              <select className="input-field mt-1" value={form.branch_id} onChange={(e) => setForm({ ...form, branch_id: e.target.value })} disabled={form.role === 'admin'}>
                {BRANCHES.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </label>
            <label className="text-xs sm:col-span-2">
              <span className="font-semibold text-gray-700">Nama Toko / Tampilan</span>
              <input className="input-field mt-1" value={form.nama_toko} onChange={(e) => setForm({ ...form, nama_toko: e.target.value })} />
            </label>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-700 mb-2">Batasan / Akses per akun:</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.keys(PERM_LABELS).map((k) => (
                <label key={k} className="flex items-center gap-2 text-xs text-gray-700 bg-gray-50 border rounded-lg px-3 py-2">
                  <input
                    type="checkbox"
                    checked={!!form.perms[k]}
                    onChange={(e) => setForm({ ...form, perms: { ...form.perms, [k]: e.target.checked } })}
                  />
                  {PERM_LABELS[k]}
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="btn-ghost flex-1 text-xs">Batal</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 text-xs">{saving ? 'Menyimpan...' : editing ? 'Simpan Perubahan' : 'Buat Akun'}</button>
          </div>
        </form>
      )}

      <div className="card space-y-2">
        {loading && <p className="py-4 text-center text-xs text-gray-400">Memuat user...</p>}
        {!loading && users.map((u) => (
          <div key={u.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b last:border-b-0">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-gray-900">{u.username}</span>
                <span className={`badge ${u.role === 'admin' ? 'badge-danger' : 'badge-info'}`}>{u.role}</span>
                {!u.active && <span className="badge badge-warning">nonaktif</span>}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {u.nama_toko || u.name} {u.branch_id ? `• ${u.branch_id}` : ''}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                Akses: {Object.entries(u.perms || {}).filter(([, v]) => v).map(([k]) => PERM_LABELS[k] || k).join(', ') || '-'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => openEdit(u)} className="btn-outline text-xs py-1.5">Edit</button>
              <button type="button" onClick={() => void toggleActive(u)} className="btn-outline text-xs py-1.5">{u.active ? 'Nonaktifkan' : 'Aktifkan'}</button>
              <button type="button" onClick={() => void remove(u)} className="btn-danger text-xs py-1.5">Hapus</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};