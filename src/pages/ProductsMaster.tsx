import React, { useState } from 'react';
import { DEMO_PRODUCTS } from '../lib/demoData';

export const ProductsMaster: React.FC = () => {
  const [products] = useState(DEMO_PRODUCTS);
  const [search, setSearch] = useState('');

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode.includes(search) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Master Produk & Barcode SKU</h2>
          <p className="text-xs text-gray-500">
            Setiap variasi merk, ukuran, dan warna memiliki Barcode unik untuk mencegah barang mirip tertukar
          </p>
        </div>

        <button type="button" onClick={() => alert('Fitur Tambah Produk')} className="btn-primary text-xs">
          + Tambah Master Produk
        </button>
      </div>

      <div className="card space-y-3">
        <input
          type="text"
          placeholder="Cari Nama / Merk / SKU / Barcode..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field"
        />

        <div className="divide-y overflow-x-auto">
          {filtered.map((p) => (
            <div key={p.id} className="py-3 flex items-center justify-between gap-4 min-w-[500px]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-gray-900">[{p.brand}] {p.name}</span>
                  <span className="badge badge-info">{p.category}</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Ukuran: <span className="font-semibold text-gray-700">{p.size || '-'}</span> | Warna:{' '}
                  <span className="font-semibold text-gray-700">{p.color || '-'}</span>
                </p>
                <p className="text-[10px] text-gray-400 font-mono mt-0.5">SKU: {p.sku}</p>
              </div>

              <div className="text-right flex items-center gap-3">
                <div className="bg-gray-100 px-3 py-1.5 rounded border text-center font-mono">
                  <p className="text-[10px] text-gray-500">BARCODE</p>
                  <p className="text-xs font-bold text-gray-900">{p.barcode}</p>
                </div>

                <button
                  type="button"
                  onClick={() => alert(`Cetak Label Barcode Thermal untuk ${p.name}`)}
                  className="btn-outline text-xs py-1.5 px-2.5"
                >
                  🖨️ Cetak Stiker
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
