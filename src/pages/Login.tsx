import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../lib/config';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<UserRole>('admin');
  const [name, setName] = useState('Admin Pusat');
  const [branch, setBranch] = useState('CB001');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login({
      id: `usr-${Date.now()}`,
      name,
      role,
      branch_id: role !== 'admin' ? branch : undefined,
    });
    navigate('/dashboard');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="card w-full max-w-md bg-white p-6 shadow-md">
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 font-extrabold text-white text-xl shadow-lg">
            GH
          </div>
          <h2 className="mt-3 text-xl font-extrabold text-gray-900">GudangHub Transfer</h2>
          <p className="text-xs text-gray-500">Sistem Pengiriman Anti-Selisih Antar Cabang</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Pilih Peran Pengguna</label>
            <select
              value={role}
              onChange={(e) => {
                const r = e.target.value as UserRole;
                setRole(r);
                if (r === 'admin') setName('Admin Pusat');
                else if (r === 'gudang_pengirim') setName('Gudang El Tari (Pengirim)');
                else if (r === 'gudang_penerima') setName('Gudang Kefa (Penerima)');
                else setName('Pak Budi (Sopir)');
              }}
              className="input-field"
            >
              <option value="admin">Admin (Pemilik / Pusat)</option>
              <option value="gudang_pengirim">Petugas Gudang Asal (Loading/Muat)</option>
              <option value="gudang_penerima">Petugas Gudang Tujuan (Unloading/Bongkar)</option>
              <option value="sopir">Sopir / Driver Transport</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Nama Petugas</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              required
            />
          </div>

          {role !== 'admin' && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Cabang Tugas</label>
              <select value={branch} onChange={(e) => setBranch(e.target.value)} className="input-field">
                <option value="CB001">Toko Nasional Kitchen (El Tari)</option>
                <option value="CB004">Toko Perabot Mamaku (Kefamenanu)</option>
                <option value="CB002">Toko Perabot Mama (Oesapa)</option>
                <option value="CB003">Toko Perabot Mama (TDM)</option>
              </select>
            </div>
          )}

          <button type="submit" className="btn-primary w-full mt-2 py-3 text-sm">
            Masuk Aplikasi
          </button>
        </form>

        <div className="mt-6 rounded-lg bg-gray-50 p-3 text-[11px] text-gray-500 space-y-1">
          <p className="font-semibold text-gray-700">Fitur Utama Sistem:</p>
          <p>✓ Blind Receiving (Penerimaan Tutup Mata)</p>
          <p>✓ Anti-Coret Nota / Approval Admin</p>
          <p>✓ Tanda Tangan 3 Pihak + Foto Bukti</p>
          <p>✓ Mode Offline Engine untuk Area Sinyal Lemah</p>
        </div>
      </div>
    </div>
  );
};
