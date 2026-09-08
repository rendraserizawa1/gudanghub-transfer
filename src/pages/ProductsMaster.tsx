import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Search, Upload, Printer, Trash2, Pencil, X } from 'lucide-react';
import { supabase as sb, fetchProducts } from '../lib/supabase';
import * as XLSX from 'xlsx';
import JsBarcode from 'jsbarcode';
import type { Product } from '../types';

const EMPTY = { sku: '', barcode: '', name: '', brand: '', category: '', unit: 'PCS', size: '', color: '' };
const TEMPLATE_ROWS = [
  { barcode: '899123456001', nama: 'Kursi Plastik Horeka', merek: 'Napoli', kategori: 'Plastik', ukuran: 'Standar', warna: 'Hijau', satuan: 'PCS' },
  { barcode: '899123456002', nama: 'Panci Stainless', merek: 'Subron', kategori: 'Stainless', ukuran: '30cm', warna: 'Silver', satuan: 'PCS' },
];

function downloadTemplate() {
  const ws = XLSX.utils.json_to_sheet(TEMPLATE_ROWS);
  ws['!cols'] = [{ wch: 16 }, { wch: 28 }, { wch: 14 }, { wch: 14 }, { wch: 10 }, { wch: 10 }, { wch: 8 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template Katalog');
  XLSX.writeFile(wb, 'template-katalog-my-report.xlsx');
}

function printBarcode(p: Product) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  try {
    JsBarcode(svg, p.barcode, { format: 'CODE128', width: 2, height: 50, fontSize: 13, margin: 6 });
  } catch {
    alert('Barcode tidak valid untuk CODE128: ' + p.barcode);
    return;
  }
  const w = window.open('', '_blank', 'width=420,height=260');
  if (!w) return;
  w.document.write(`<html><head><title>${p.barcode}</title></head><body style="margin:0;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:monospace">
    <div style="font-size:12px;font-weight:bold">[${p.brand}] ${p.name}</div>
    <div style="font-size:10px">${p.size || ''} ${p.color || ''} • ${p.unit}</div>
    ${svg.outerHTML}
  </body></html>`);
  w.document.close();
  w.focus();
  w.print();
}

export const ProductsMaster: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    try { setProducts(await fetchProducts()); } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => products.filter(
    (p) => p.name.toLowerCase().includes(search.toLowerCase())
      || p.brand.toLowerCase().includes(search.toLowerCase())
      || p.barcode.includes(search)
      || p.sku.toLowerCase().includes(search.toLowerCase())
  ), [products, search]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sb) return;
    if (!form.sku || !form.barcode || !form.name || !form.brand || !form.category) {
      alert('SKU, Barcode, Nama, Merk, dan Kategori wajib diisi.');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        const { error } = await sb.from('products').update(form).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await sb.from('products').insert(form);
        if (error) throw error;
      }
      setShowForm(false); setEditingId(null); setForm(EMPTY);
      void load();
    } catch (err) {
      alert(`Gagal: ${err instanceof Error ? err.message : err}`);
    } finally {
      setSaving(false);
    }
  };

  const remove = (p: Product) => {
    if (!window.confirm(`Hapus produk "${p.name}" (${p.barcode})? Tindakan permanen.`)) return;
    void sb?.from('products').delete().eq('id', p.id).then(({ error }) => {
      if (error) { alert('Gagal hapus: ' + error.message); return; }
      void load();
    });
  };

  const importXLSX = async (file: File) => {
    setImporting(true);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf);
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
      let ok = 0, skipped = 0;
      const errors: string[] = [];
      for (const r of raw) {
        const barcode = String(r.barcode ?? r.Barcode ?? '').trim();
        const name = String(r.nama ?? r.Nama ?? '').trim();
        const brand = String(r.merek ?? r.Merek ?? '').trim();
        const category = String(r.kategori ?? r.Kategori ?? '').trim() || 'Umum';
        if (!barcode || !name || !brand) { skipped++; continue; }
        const exists = products.some((p) => p.barcode === barcode);
        if (exists) { skipped++; continue; }
        const { error } = await sb!.from('products').insert({
          barcode, name, brand, category, sku: String(r.sku ?? r.SKU ?? barcode), unit: String(r.satuan ?? r.Satuan ?? 'PCS'),
          size: String(r.ukuran ?? r.Ukuran ?? '') || null, color: String(r.warna ?? r.Warna ?? '') || null,
        });
        if (error) { errors.push(`${barcode}: ${error.message}`); skipped++; } else ok++;
      }
      await load();
      alert(`Import selesai ✓\nMasuk: ${ok}\nDilewati (duplikat/kolom kurang): ${skipped}${errors.length ? '\nError: ' + errors.slice(0, 3).join('; ') : ''}`);
    } catch (e) {
      alert('Gagal membaca file: ' + (e instanceof Error ? e.message : e));
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const inputCls = 'input-field dark:bg-[#0A0E1A] dark:border-[#232840] dark:text-gray-200';
  const cardCls = 'card dark:bg-[#141828] dark:border-[#232840]';
  const textCls = 'text-gray-900 dark:text-white';

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className={`text-xl font-bold ${textCls}`}>Katalog Barang</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">Master barcode: tambah, edit, hapus, dan import massal via XLSX</p>
        </div>
        <div className="flex gap-2">
          <button onClick={downloadTemplate} className="btn-outline dark:bg-[#141828] dark:border-[#232840] dark:text-gray-300 text-xs flex items-center gap-1.5">
            <Upload size={14} /> Template
          </button>
          <button onClick={() => fileRef.current?.click()} disabled={importing} className="btn-outline dark:bg-[#141828] dark:border-[#232840] dark:text-gray-300 text-xs flex items-center gap-1.5">
            <Upload size={14} /> {importing ? 'Import...' : 'Import XLSX'}
          </button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void importXLSX(f); }} />
          <button onClick={() => { setEditingId(null); setForm(EMPTY); setShowForm((v) => !v); }} className="btn-primary text-xs flex items-center gap-1.5">
            {showForm ? <X size={14} /> : <Plus size={14} />} {showForm ? 'Tutup' : 'Tambah'}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={save} className={cardCls + ' space-y-3'}>
          <h3 className={`text-sm font-bold ${textCls}`}>{editingId ? 'Edit Produk' : 'Tambah Produk'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {([['barcode', 'Barcode *'], ['sku', 'SKU *'], ['name', 'Nama *'], ['brand', 'Merek *'], ['category', 'Kategori *'], ['size', 'Ukuran'], ['color', 'Warna']] as const).map(([k, label]) => (
              <label key={k} className="text-xs">
                <span className="font-semibold text-gray-700 dark:text-gray-300">{label}</span>
                <input className={`${inputCls} mt-1`} value={form[k as keyof typeof form]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} required={label.includes('*')} />
              </label>
            ))}
            <label className="text-xs">
              <span className="font-semibold text-gray-700 dark:text-gray-300">Satuan</span>
              <select className={`${inputCls} mt-1`} value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
                {['PCS', 'SET', 'LUSIN'].map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </label>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="btn-ghost flex-1 text-xs">Batal</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 text-xs">{saving ? 'Menyimpan...' : 'Simpan Produk'}</button>
          </div>
        </form>
      )}

      <div className={cardCls + ' space-y-3'}>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text" placeholder="Cari nama / merek / SKU / barcode..." value={search} onChange={(e) => setSearch(e.target.value)}
            className={`${inputCls} pl-9`}
          />
        </div>

        <div className="divide-y divide-gray-100 dark:divide-[#1d2238] overflow-x-auto">
          {loading && <p className="py-4 text-center text-xs text-gray-400">Memuat produk...</p>}
          {!loading && filtered.length === 0 && <p className="py-4 text-center text-xs text-gray-400 dark:text-gray-500">Tidak ada produk ditemukan.</p>}
          {filtered.map((p) => (
            <div key={p.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-[560px]">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`font-bold text-xs ${textCls}`}>[{p.brand}] {p.name}</span>
                  <span className="badge badge-info">{p.category}</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {p.size || '-'} • {p.color || '-'} • {p.unit}
                </p>
                <p className="text-[10px] text-gray-400 font-mono mt-0.5">{p.barcode} · {p.sku}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => printBarcode(p)} className="btn-outline dark:bg-[#0A0E1A] dark:border-[#232840] dark:text-gray-300 text-xs py-1.5 px-2.5 flex items-center gap-1" title="Cetak label barcode">
                  <Printer size={13} /> Cetak
                </button>
                <button onClick={() => { setEditingId(p.id); setForm({ sku: p.sku, barcode: p.barcode, name: p.name, brand: p.brand, category: p.category, unit: p.unit, size: p.size || '', color: p.color || '' }); setShowForm(true); }} className="btn-outline dark:bg-[#0A0E1A] dark:border-[#232840] dark:text-gray-300 text-xs py-1.5 px-2.5 flex items-center gap-1">
                  <Pencil size={13} /> Edit
                </button>
                <button onClick={() => remove(p)} className="btn-outline text-xs py-1.5 px-2.5 flex items-center gap-1 text-danger-600 border-danger-300 dark:border-red-900/50" title="Hapus">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};