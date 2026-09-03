import React, { useEffect, useState } from 'react';
import { supabase as sb, fetchProducts } from '../lib/supabase';
import type { Product } from '../types';

const EMPTY_FORM = { sku: '', barcode: '', name: '', brand: '', category: '', unit: 'PCS', size: '', color: '' };

export const ProductsMaster: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const data = await fetchProducts();
      setProducts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode.includes(search) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const addProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sb) return;
    if (!form.sku || !form.barcode || !form.name || !form.brand || !form.category) {
      alert('SKU, Barcode, Nama, Merk, dan Kategori wajib diisi.');
      return;
    }
    setSaving(true);
    const { error } = await sb.from('products').insert({
      sku: form.sku,
      barcode: form.barcode,
      name: form.name,
      brand: form.brand,
      category: form.category,
      unit: form.unit || 'PCS',
      size: form.size || null,
      color: form.color || null,
    });
    setSaving(false);
    if (error) {
      alert(`Gagal menambah produk: ${error.message}`);
      return;
    }
    setShowForm(false);
    setForm(EMPTY_FORM);
    void load();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Master Produk & Barcode SKU</h2>
          <p className="text-xs text-gray-500">
            Setiap variasi merk, ukuran, dan warna memiliki Barcode unik untuk mencegah barang mirip tertukar
          </p>
        </div>

        <button type="button" onClick={() => setShowForm((v) => !v)} className="btn-primary text-xs">
          {showForm ? 'Tutup Form' : '+ Tambah Master Produk'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={addProduct} className="card space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input className="input-field" placeholder="SKU *" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
            <input className="input-field" placeholder="Barcode *" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} />
            <input className="input-field" placeholder="Nama Produk *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className="input-field" placeholder="Merk / Brand *" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
            <input className="input-field" placeholder="Kategori * (mis: Plastik)" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            <select className="input-field" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
              <option value="PCS">PCS</option>
              <option value="SET">SET</option>
              <option value="LUSIN">LUSIN</option>
            </select>
            <input className="input-field" placeholder="Ukuran (mis: 30 cm)" value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} />
            <input className="input-field" placeholder="Warna (mis: Hijau)" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={() => setShowForm(false)} className="btn-ghost flex-1 text-xs">Batal</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 text-xs">{saving ? 'Menyimpan...' : 'Simpan Produk'}</button>
          </div>
        </form>
      )}

      <div className="card space-y-3">
        <input
          type="text"
          placeholder="Cari Nama / Merk / SKU / Barcode..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field"
        />

        <div className="divide-y overflow-x-auto">
          {loading && <p className="py-4 text-center text-xs text-gray-400">Memuat produk...</p>}
          {!loading && filtered.length === 0 && (
            <p className="py-4 text-center text-xs text-gray-400">Tidak ada produk ditemukan.</p>
          )}
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