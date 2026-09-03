import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Login: React.FC = () => {
  const { login, authError, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const ok = await login(email.trim(), password);
    setSubmitting(false);
    if (ok) navigate('/dashboard');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="card w-full max-w-md bg-white p-6 shadow-md">
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 font-extrabold text-white text-xl shadow-lg">
            GH
          </div>
          <h2 className="mt-3 text-xl font-extrabold text-gray-900">GudangHub Transfer</h2>
          <p className="text-xs text-gray-500">Sistem Distribusi Barang Pusat ke Cabang</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Email Akun</label>
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@perusahaan.com"
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input-field"
              required
            />
          </div>

          {authError && (
            <p className="rounded-lg bg-danger-500/5 border border-danger-500/20 px-3 py-2 text-xs text-danger-600">
              {authError}
            </p>
          )}

          <button type="submit" disabled={submitting || loading} className="btn-primary w-full mt-2 py-3 text-sm">
            {submitting ? 'Memeriksa...' : 'Masuk Aplikasi'}
          </button>
        </form>

        <div className="mt-6 rounded-lg bg-gray-50 p-3 text-[11px] text-gray-500 space-y-1">
          <p className="font-semibold text-gray-700">Fitur Utama Sistem:</p>
          <p>✓ Blind Receiving (Penerimaan Tutup Mata)</p>
          <p>✓ Scan Barcode Kamera HP / Ketik Manual</p>
          <p>✓ Tanda Tangan 3 Pihak + Foto Bukti</p>
          <p>✓ Selisih Wajib Approval Superadmin</p>
          <p>✓ Mode Offline Engine untuk Area Sinyal Lemah</p>
        </div>
      </div>
    </div>
  );
};