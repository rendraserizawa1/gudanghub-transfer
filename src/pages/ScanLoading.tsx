import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase as sb, findProductByBarcode } from '../lib/supabase';
import { capturePhoto, addWatermark } from '../lib/camera';
import { SignatureModal } from '../components/SignatureModal';
import { BarcodeScanner } from '../components/BarcodeScanner';
import { getBranchName } from '../lib/config';
import type { Product } from '../types';

interface LoadableItem {
  id: string;
  product_id: string;
  product_name: string;
  product?: Product;
  qty_planned: number;
  qty_loaded: number;
}

export const ScanLoading: React.FC = () => {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const id = params.get('id');

  const [orderNo, setOrderNo] = useState('');
  const [destBranch, setDestBranch] = useState('');
  const [driverName, setDriverName] = useState('');
  const [plate, setPlate] = useState('');
  const [items, setItems] = useState<LoadableItem[]>([]);
  const [loadedQty, setLoadedQty] = useState<Record<string, number>>({});
  const [photoSeal, setPhotoSeal] = useState<string | null>(null);
  const [status, setStatus] = useState('');

  const [sigPengirim, setSigPengirim] = useState<string | null>(null);
  const [sigSopir, setSigSopir] = useState<string | null>(null);
  const [sopirName, setSopirName] = useState('');
  const [activeSigModal, setActiveSigModal] = useState<'pengirim' | 'sopir' | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!sb || !id) return;
      const { data, error } = await sb
        .from('transfer_orders')
        .select('*, transfer_order_items(*)')
        .eq('id', id)
        .single();
      if (error || !data) return;
      setOrderNo(data.order_no);
      setDestBranch(data.dest_branch_id);
      setDriverName(data.driver_name || '');
      setPlate(data.truck_plate || '');
      setStatus(data.status);

      const rows = (data.transfer_order_items || []).map((r: Record<string, unknown>) => {
        const pid = r.product_id as string;
        return {
          id: r.id as string,
          product_id: pid,
          product_name: pid,
          qty_planned: (r.qty_planned as number) || 0,
          qty_loaded: (r.qty_loaded as number) || 0,
        };
      });
      setItems(rows);
      const init: Record<string, number> = {};
      rows.forEach((r: LoadableItem) => { init[r.product_id] = r.qty_loaded; });
      setLoadedQty(init);

      const { data: prods } = await sb.from('products').select('id, name, brand, barcode');
      if (prods) {
        const nameMap = new Map((prods as Array<{ id: string; name: string; brand: string }>).map((p) => [p.id, `[${p.brand}] ${p.name}`]));
        setItems((prev) => prev.map((r) => ({ ...r, product_name: nameMap.get(r.product_id) || r.product_name })));
      }
    };
    void load();
  }, [id]);

  const handleScan = async (barcode: string) => {
    const product = await findProductByBarcode(barcode);
    if (!product) {
      alert('⚠️ Barcode Tidak Dikenal dalam Master Produk!');
      return;
    }
    const itemInTransfer = items.find((i) => i.product_id === product.id);
    if (!itemInTransfer) {
      alert(`⚠️ Peringatan: Barang [${product.name}] Tidak Ada di Surat Jalan Ini!`);
      return;
    }
    setLoadedQty((prev) => ({
      ...prev,
      [product.id]: (prev[product.id] || 0) + 1,
    }));
  };

  const handleCaptureSeal = async () => {
    try {
      const rawPhoto = await capturePhoto();
      const watermarked = await addWatermark(
        rawPhoto.dataUrl,
        `FOTO SEGEL MUAT - ${user?.branch_name || 'GUDANG'}\nNo TO: ${orderNo}\nWaktu: ${new Date().toLocaleString()}`
      );
      setPhotoSeal(watermarked);
    } catch (e) {
      console.error(e);
    }
  };

  const completeLoading = async () => {
    if (!sb || !id) return;
    if (!photoSeal) { alert('Wajib ambil foto segel truk!'); return; }
    if (!sigPengirim || !sigSopir) { alert('Wajib tanda tangan pengirim & sopir!'); return; }
    if (items.some((i) => (loadedQty[i.product_id] || 0) < i.qty_planned)) {
      if (!confirm('Ada barang belum ter-scan sesuai rencana. Lanjutkan juga?')) return;
    }

    const rows = items.map((i) => {
      const qty = loadedQty[i.product_id] || 0;
      return {
        id: i.id,
        product_id: i.product_id,
        qty_planned: i.qty_planned,
        qty_loaded: qty,
        qty_received: 0,
      };
    });

    for (const row of rows) {
      const { error: itemErr } = await sb
        .from('transfer_order_items')
        .update({ qty_loaded: row.qty_loaded })
        .eq('id', row.id);
      if (itemErr) { alert(`Gagal update item: ${itemErr.message}`); return; }
    }

    const { error } = await sb.from('transfer_orders').update({
      status: 'in_transit',
      photo_loading_seal: photoSeal,
      sign_pengirim: sigPengirim,
      sign_sopir: sigSopir,
      driver_name: sopirName || driverName,
      loaded_by: user?.name || '',
      loaded_at: new Date().toISOString(),
    }).eq('id', id);
    if (error) {
      alert(`Gagal menyelesaikan proses muat: ${error.message}`);
      return;
    }
    alert('Proses Muat Selesai! Status berubah menjadi IN TRANSIT.');
    setStatus('in_transit');
  };

  const isDone = status === 'in_transit' || status === 'receiving' || status === 'completed';

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Scan Muat Barang</h2>
        <p className="text-xs text-gray-500">Scan fisik barang satu per satu sebelum dimasukkan ke dalam truk</p>
      </div>

      {!id && (
        <div className="card p-8 text-center text-xs text-gray-400">
          Pilih surat jalan berstatus <strong>Sedang Muat</strong> dari daftar Surat Jalan untuk mulai scan.
        </div>
      )}

      {id && (
        <div className="card space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <span className="font-bold text-brand-700">{orderNo || 'Memuat...'}</span>
            <span className="badge badge-warning">{status === 'in_transit' ? 'Berangkat' : 'Proses Muat'}</span>
          </div>

          <div className="text-xs space-y-1 text-gray-600">
            <p>Sopir: <span className="font-semibold text-gray-900">{driverName || '-'}</span> ({plate || '-'})</p>
            <p>Tujuan: <span className="font-semibold text-gray-900">{getBranchName(destBranch) || '-'}</span></p>
          </div>

          <div className="border-t pt-3 space-y-2">
            <label className="block text-xs font-semibold text-gray-700">Input / Scan Barcode Produk</label>
            <BarcodeScanner onDetected={(b) => void handleScan(b)} />
            <p className="text-[10px] text-gray-400">
              Kamera akan diminta izin saat dinyalakan. Barcode wajib terdaftar di Master Produk.
            </p>
          </div>

          <div className="border-t pt-3 space-y-2">
            <h3 className="text-xs font-bold text-gray-900">Progress Scan Muat Barang</h3>
            <div className="divide-y border rounded-lg overflow-hidden">
              {items.map((item) => {
                const loaded = loadedQty[item.product_id] || 0;
                const isComplete = loaded >= item.qty_planned;
                return (
                  <div key={item.id} className="p-3 bg-white flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-gray-900">{item.product_name}</p>
                      <p className="text-[10px] text-gray-400 font-mono">Barcode: {item.product_id}</p>
                    </div>
                    <div className="text-right">
                      <span className={`font-bold ${isComplete ? 'text-success-600' : 'text-warning-600'}`}>
                        {loaded} / {item.qty_planned}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-t pt-3 space-y-3">
            <h3 className="text-xs font-bold text-gray-900">Bukti Foto Bagasi & Segel Terkunci</h3>
            {photoSeal ? (
              <div className="relative rounded-lg overflow-hidden border">
                <img src={photoSeal} alt="Foto Segel" className="w-full h-48 object-cover" />
                <button
                  type="button"
                  onClick={() => setPhotoSeal(null)}
                  className="absolute top-2 right-2 btn-danger text-[10px] py-1 px-2"
                >
                  Ambil Ulang Foto
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => void handleCaptureSeal()} className="btn-outline w-full py-3 text-xs">
                📸 Ambil Foto Pintu Truk Terkunci / Bagasi
              </button>
            )}
          </div>

          <div className="border-t pt-3 space-y-3">
            <h3 className="text-xs font-bold text-gray-900">Tanda Tangan Digital 2 Pihak</h3>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Nama Sopir (diisi petugas)</label>
              <input
                type="text"
                value={sopirName}
                onChange={(e) => setSopirName(e.target.value)}
                className="input-field"
                placeholder="Nama sopir di sini"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setActiveSigModal('pengirim')}
                className="btn-outline text-xs py-2.5"
              >
                {sigPengirim ? '✓ TT Pengirim' : '✍️ TT Pengirim'}
              </button>
              <button
                type="button"
                onClick={() => { if (!sopirName.trim()) alert('Isi nama sopir dulu!'); else setActiveSigModal('sopir'); }}
                className="btn-outline text-xs py-2.5"
              >
                {sigSopir ? '✓ TT Sopir' : '✍️ TT Sopir Transport'}
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void completeLoading()}
            disabled={isDone}
            className="btn-success w-full py-3 text-sm mt-4"
          >
            {isDone ? 'Proses muat selesai' : 'Konfirmasi Muat & Mobil Berangkat (In Transit)'}
          </button>
        </div>
      )}

      <SignatureModal
        isOpen={activeSigModal === 'pengirim'}
        title={`Tanda Tangan Pengirim (${user?.role === 'checker' ? 'Checker - Gudang Pusat' : user?.branch_name || ''})`}
        onClose={() => setActiveSigModal(null)}
        onSave={(data) => setSigPengirim(data)}
      />

      <SignatureModal
        isOpen={activeSigModal === 'sopir'}
        title="Tanda Tangan Sopir / Driver"
        onClose={() => setActiveSigModal(null)}
        onSave={(data) => setSigSopir(data)}
      />
    </div>
  );
};