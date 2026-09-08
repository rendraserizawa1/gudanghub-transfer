import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const PasswordChange: React.FC = () => {
  const { updateOwnPassword } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) { setMsg('Password minimal 6 karakter.'); return; }
    if (newPassword !== confirm) { setMsg('Konfirmasi password tidak sama.'); return; }
    setSaving(true);
    setMsg(null);
    const ok = await updateOwnPassword(newPassword);
    setSaving(false);
    setMsg(ok ? 'Password berhasil diubah.' : 'Gagal mengubah password.');
    if (ok) { setNewPassword(''); setConfirm(''); }
  };

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Ganti Password</h2>
        <p className="text-xs text-gray-500">Ubah password akun Anda sendiri</p>
      </div>

      <form onSubmit={save} className="card space-y-3">
        <label className="block text-xs">
          <span className="font-semibold text-gray-700">Password Baru *</span>
          <input type="password" className="input-field mt-1" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} />
        </label>
        <label className="block text-xs">
          <span className="font-semibold text-gray-700">Konfirmasi Password *</span>
          <input type="password" className="input-field mt-1" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
        </label>
        {msg && <p className={`text-xs ${msg.includes('berhasil') ? 'text-success-600' : 'text-danger-600'}`}>{msg}</p>}
        <button type="submit" disabled={saving} className="btn-primary w-full text-xs">
          {saving ? 'Menyimpan...' : 'Simpan Password Baru'}
        </button>
      </form>
    </div>
  );
};