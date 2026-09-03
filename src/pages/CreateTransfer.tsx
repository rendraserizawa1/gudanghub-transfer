import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BRANCHES, getBranchName } from '../lib/config';
import { fetchProducts, createTransfer, insertTransferItems } from '../lib/supabase';
import type { Product } from '../types';

export const CreateTransfer: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [saving, setSaving] = useState(false);

  const isSuper = user?.role === 'superadmin';
  const isChecker = user?.role === 'checker';
  const allowedOrigin = isChecker ? ['CB000'] : [user?.branch_id || ''];

  const [origin, setOrigin] = useState(isSuper ? 'CB000' : allowedOrigin[0]);
  const [dest, setDest] = useState('CB001');
  const [driver, setDriver] = useState('');
  const [plate, setPlate] = useState('');

  const [selectedItems, setSelectedItems] = useState<Array<{ product_id: string; qty: number }>>([]);

  useEffect(() => {
    void fetchProducts().then(setProducts).catch(console.error);
  }, []);

  const addItemRow = () => {
    if (products.length === 0) return;
    setSelectedItems([...selectedItems, { product_id: products[0].id, qty: 1 }]);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (selectedItems.length === 0) {
      alert('Tambahkan minimal 1 barang ke surat jalan.');
      return;
    }
    if (origin === dest) {
      alert('Cabang asal dan tujuan tidak boleh sama.');
      return;
    }
    setSaving(true);
    try {
      const date = new Date();
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const seq = Date.now().toString().slice(-4);
      const order_no = `TO/${y}/${m}/${seq}`;

      const created = await createTransfer({
        order_no,
        origin_branch_id: origin,
        dest_branch_id: dest,
        created_by: user.name,
        driver_name: driver || 'Belum diisi',
        truck_plate: plate || 'Belum diisi',
      });

      await insertTransferItems(
        selectedItems.map((i) => ({
          transfer_id: created.id,
          product_id: i.product_id,
          qty_planned: i.qty,
        }))
      );

      alert(`Surat Jalan ${order_no} berhasil dibuat!`);
      navigate('/transfers');
    } catch (err) {
      alert(`Gagal membuat surat jalan: ${err instanceof Error ? err.message : err}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Buat Surat Jalan Digital Baru</h2>
        <p className="text-xs text-gray-500">Tentukan cabang asal, tujuan, sopir, dan daftar rencana muat barang</p>
      </div>

      <form onSubmit={handleCreate} className="card space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Cabang Asal (Loading)</label>
            <select value={origin} onChange={(e) => setOrigin(e.target.value)} className="input-field" disabled={!isSuper}>
              {BRANCHES.filter((b) => b.type === 'pusat' || (isSuper || b.id === user?.branch_id || b.id === 'CB000')).map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            {!isSuper && <p className="text-[10px] text-gray-400 mt-1">Origin sesuai akun Anda ({getBranchName(origin)})</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Cabang Tujuan (Unloading)</label>
            <select value={dest} onChange={(e) => setDest(e.target.value)} className="input-field">
              {BRANCHES.filter((b) => b.type === 'toko' && b.id !== origin).map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Nama Sopir / Transport</label>
            <input type="text" value={driver} onChange={(e) => setDriver(e.target.value)} className="input-field" placeholder="Nama sopir" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Nomor Plat Mobil</label>
            <input type="text" value={plate} onChange={(e) => setPlate(e.target.value)} className="input-field" placeholder="DH 1234 AB" />
          </div>
        </div>

        <div className="border-t pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-900">Daftar Rencana Muat Barang</h3>
            <button type="button" onClick={addItemRow} className="text-xs font-semibold text-brand-600 hover:underline">
              + Tambah Barang
            </button>
          </div>

          {selectedItems.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <select
                value={item.product_id}
                onChange={(e) => {
                  const copy = [...selectedItems];
                  copy[idx].product_id = e.target.value;
                  setSelectedItems(copy);
                }}
                className="input-field flex-1"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.brand}] {p.name} ({p.size || '-'}, {p.color || '-'}) - Barcode: {p.barcode}
                  </option>
                ))}
              </select>

              <input
                type="number"
                min={1}
                value={item.qty}
                onChange={(e) => {
                  const copy = [...selectedItems];
                  copy[idx].qty = parseInt(e.target.value) || 1;
                  setSelectedItems(copy);
                }}
                className="input-field w-20 text-center"
              />

              <button
                type="button"
                onClick={() => setSelectedItems(selectedItems.filter((_, i) => i !== idx))}
                className="text-danger-500 font-bold px-2"
              >
                ✕
              </button>
            </div>
          ))}
          {selectedItems.length === 0 && (
            <p className="text-center text-xs text-gray-400 py-2">Belum ada barang. Klik + Tambah Barang.</p>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <button type="button" onClick={() => navigate('/transfers')} className="btn-outline flex-1" disabled={saving}>
            Batal
          </button>
          <button type="submit" className="btn-primary flex-1" disabled={saving || products.length === 0}>
            {saving ? 'Menyimpan...' : 'Simpan & Terbitkan Surat Jalan'}
          </button>
        </div>
      </form>
    </div>
  );
};