import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BRANCHES } from '../lib/config';
import { DEMO_PRODUCTS } from '../lib/demoData';

export const CreateTransfer: React.FC = () => {
  const navigate = useNavigate();
  const [origin, setOrigin] = useState('CB001');
  const [dest, setDest] = useState('CB004');
  const [driver, setDriver] = useState('Pak Budi');
  const [plate, setPlate] = useState('DH 8892 AA');

  const [selectedItems, setSelectedItems] = useState<Array<{ product_id: string; qty: number }>>([
    { product_id: DEMO_PRODUCTS[0].id, qty: 10 },
  ]);

  const addItemRow = () => {
    setSelectedItems([...selectedItems, { product_id: DEMO_PRODUCTS[0].id, qty: 1 }]);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Surat Jalan Digital (TO) Berhasil Dibuat!');
    navigate('/transfers');
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Buat Surat Jalan Digital Baru</h2>
        <p className="text-xs text-gray-500">Tentukan rujukan cabang asal, cabang tujuan, sopir, dan daftar rencana muat barang</p>
      </div>

      <form onSubmit={handleCreate} className="card space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Cabang Asal (Loading)</label>
            <select value={origin} onChange={(e) => setOrigin(e.target.value)} className="input-field">
              {BRANCHES.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Cabang Tujuan (Unloading)</label>
            <select value={dest} onChange={(e) => setDest(e.target.value)} className="input-field">
              {BRANCHES.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Nama Sopir / Transport</label>
            <input type="text" value={driver} onChange={(e) => setDriver(e.target.value)} className="input-field" required />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Nomor Plat Mobil</label>
            <input type="text" value={plate} onChange={(e) => setPlate(e.target.value)} className="input-field" required />
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
                {DEMO_PRODUCTS.map((p) => (
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
        </div>

        <div className="flex gap-2 pt-2">
          <button type="button" onClick={() => navigate('/transfers')} className="btn-outline flex-1">
            Batal
          </button>
          <button type="submit" className="btn-primary flex-1">
            Simpan & Terbitkan Surat Jalan
          </button>
        </div>
      </form>
    </div>
  );
};
