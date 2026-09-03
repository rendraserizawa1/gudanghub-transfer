import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase as sb, findProductByBarcode } from '../lib/supabase';
import { capturePhoto, addWatermark } from '../lib/camera';
import { SignatureModal } from '../components/SignatureModal';
import { BarcodeScanner } from '../components/BarcodeScanner';
import { getBranchName } from '../lib/config';
import type { Product } from '../types';

export const ScanReceiving: React.FC = () => {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const id = params.get('id');

  const [orderNo, setOrderNo] = useState('');
  const [originBranch, setOriginBranch] = useState('');
  const [driverName, setDriverName] = useState('');
  const [receivedQty, setReceivedQty] = useState<Record<string, number>>({});
  const [photoUnload, setPhotoUnload] = useState<string | null>(null);

  const [sigPenerima, setSigPenerima] = useState<string | null>(null);
  const [sigSopir, setSigSopir] = useState<string | null>(null);
  const [sopirName, setSopirName] = useState('');
  const [activeSigModal, setActiveSigModal] = useState<'penerima' | 'sopir' | null>(null);

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState<'missing' | 'excess' | 'damaged'>('missing');
  const [reportProductId, setReportProductId] = useState('');
  const [reportQty, setReportQty] = useState(1);
  const [reportNotes, setReportNotes] = useState('');
  const [reportPhoto, setReportPhoto] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);

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
      setOriginBranch(data.origin_branch_id);
      setDriverName(data.driver_name || '');
      };
    void load();
    void sb?.from('products').select('*').then(({ data }) => setProducts(data || []));
  }, [id]);

  const handleBlindScan = async (barcode: string) => {
    const product = await findProductByBarcode(barcode);
    if (!product) {
      alert('⚠️ Barcode Tidak Terdaftar di Sistem Master!');
      return;
    }
    setReceivedQty((prev) => ({
      ...prev,
      [product.id]: (prev[product.id] || 0) + 1,
    }));
  };

  const handleCaptureUnloadPhoto = async () => {
    try {
      const raw = await capturePhoto();
      const watermarked = await addWatermark(
        raw.dataUrl,
        `FOTO PINTU BONGKAR - ${user?.branch_name || 'CABANG'}\nNo TO: ${orderNo}\nWaktu: ${new Date().toLocaleString()}`
      );
      setPhotoUnload(watermarked);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCaptureReportPhoto = async () => {
    try {
      const raw = await capturePhoto();
      const watermarked = await addWatermark(
        raw.dataUrl,
        `BUKTI FISIK SELISIH - ${user?.branch_name || 'CABANG'}\nNo TO: ${orderNo}\nJenis: ${reportType.toUpperCase()}`
      );
      setReportPhoto(watermarked);
    } catch (e) {
      console.error(e);
    }
  };

  const submitReport = async () => {
    if (!sb || !id) return;
    if (!reportPhoto) { alert('Wajib melampirkan foto bukti selisih!'); return; }
    if (!reportProductId) { alert('Pilih produk!'); return; }
    const { error } = await sb.from('transfer_discrepancies').insert({
      transfer_id: id,
      product_id: reportProductId,
      type: reportType,
      qty_diff: reportType === 'excess' ? reportQty : -reportQty,
      photo_proof_url: reportPhoto,
      notes: reportNotes,
      admin_status: 'pending',
    });
    if (error) {
      alert(`Gagal kirim laporan: ${error.message}`);
      return;
    }
    await sb.from('transfer_orders').update({ status: 'discrepancy' }).eq('id', id);
    alert('Laporan Selisih Terkirim ke Admin untuk Approval!');
    setShowReportModal(false);
  };

  const completeReceiving = async () => {
    if (!sb || !id) return;
    if (!photoUnload) { alert('Wajib ambil foto kondisi pintu mobil!'); return; }
    if (!sigPenerima || !sigSopir) { alert('Wajib tanda tangan penerima & sopir!'); return; }
    const { error } = await sb.from('transfer_orders').update({
      status: 'completed',
      photo_unloading_seal: photoUnload,
      sign_penerima: sigPenerima,
      sign_sopir: sigSopir,
      received_by: user?.name || '',
      received_at: new Date().toISOString(),
    }).eq('id', id);
    if (error) {
      alert(`Gagal menyelesaikan penerimaan: ${error.message}`);
      return;
    }
    alert('Penerimaan Selesai! Data dicocokkan otomatis oleh sistem.');
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="bg-brand-50 border border-brand-200 rounded-xl p-3">
        <div className="flex items-center gap-2 text-brand-800 font-bold text-sm">
          <span>🔒 Mode Blind Receiving (Tutup Mata)</span>
        </div>
        <p className="text-xs text-brand-700 mt-1">
          Daftar kuantitas disembunyikan. Petugas wajib scan satu per satu barang fisik yang turun dari mobil.
        </p>
      </div>

      {!id && (
        <div className="card p-8 text-center text-xs text-gray-400">
          Pilih surat jalan berstatus <strong>Dalam Perjalanan</strong> dari daftar Surat Jalan untuk mulai bongkar.
        </div>
      )}

      {id && (
        <div className="card space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <span className="font-bold text-brand-700">{orderNo || 'Memuat...'}</span>
            <span className="badge badge-info">Proses Bongkar</span>
          </div>

          <div className="text-xs space-y-1 text-gray-600">
            <p>Asal: <span className="font-semibold text-gray-900">{getBranchName(originBranch) || '-'}</span></p>
            <p>Sopir: <span className="font-semibold text-gray-900">{driverName || '-'}</span></p>
          </div>

          <div className="border-t pt-3 space-y-2">
            <label className="block text-xs font-semibold text-gray-700">Scan Barcode Barang Turun</label>
            <BarcodeScanner onDetected={(b) => void handleBlindScan(b)} placeholder="Scan barcode barang fisik..." buttonLabel="Scan" />
          </div>

          <div className="border-t pt-3 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-gray-900">Hasil Scan Fisik Turun</h3>
              <button
                type="button"
                onClick={() => setShowReportModal(true)}
                className="btn-danger text-[11px] py-1 px-2.5"
              >
                ⚠️ Laporkan Selisih / Rusak
              </button>
            </div>

            <div className="divide-y border rounded-lg overflow-hidden bg-white">
              {Object.keys(receivedQty).length === 0 ? (
                <p className="p-4 text-center text-xs text-gray-400">Belum ada barang yang discan turun.</p>
              ) : (
                Object.entries(receivedQty).map(([prodId, count]) => {
                  const p = products.find((x) => x.id === prodId);
                  return (
                    <div key={prodId} className="p-3 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-gray-900">{p ? `[${p.brand}] ${p.name}` : prodId}</p>
                        <p className="text-gray-500">{p?.size || ''} {p?.color ? `| ${p.color}` : ''}</p>
                      </div>
                      <span className="font-bold text-brand-600 text-sm">{count} {p?.unit || 'PCS'}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="border-t pt-3 space-y-3">
            <h3 className="text-xs font-bold text-gray-900">Foto Kondisi Pintu Truk Sebelum Dibuka</h3>
            {photoUnload ? (
              <div className="relative rounded-lg overflow-hidden border">
                <img src={photoUnload} alt="Foto Bongkar" className="w-full h-48 object-cover" />
                <button
                  type="button"
                  onClick={() => setPhotoUnload(null)}
                  className="absolute top-2 right-2 btn-danger text-[10px] py-1 px-2"
                >
                  Ulangi Foto
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => void handleCaptureUnloadPhoto()} className="btn-outline w-full py-3 text-xs">
                📸 Ambil Foto Pintu Mobil Sebelum Dibuka
              </button>
            )}
          </div>

          <div className="border-t pt-3 space-y-3">
            <h3 className="text-xs font-bold text-gray-900">Tanda Tangan Digital 2 Pihak (Penerima & Sopir)</h3>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Nama Sopir (konfirmasi)</label>
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
                onClick={() => setActiveSigModal('penerima')}
                className="btn-outline text-xs py-2.5"
              >
                {sigPenerima ? '✓ TT Penerima' : '✍️ TT Petugas Penerima'}
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
            onClick={() => void completeReceiving()}
            className="btn-success w-full py-3 text-sm mt-4"
          >
            Selesaikan Penerimaan Bongkar
          </button>
        </div>
      )}

      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="card w-full max-w-md bg-white p-4 space-y-3">
            <h3 className="text-base font-bold text-danger-600">Form Laporan Selisih / Kerusakan</h3>
            <p className="text-xs text-gray-500">
              Setiap catatan perubahan wajib melampirkan foto bukti fisik. Nota kertas dilarang dicoret.
            </p>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Jenis Selisih</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as 'missing' | 'excess' | 'damaged')}
                className="input-field"
              >
                <option value="missing">Barang Kurang (Fisik Tidak Ada)</option>
                <option value="excess">Barang Lebih (Fisik Ekstra)</option>
                <option value="damaged">Barang Fisik Rusak / Cacat</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Pilih Produk</label>
              <select
                value={reportProductId}
                onChange={(e) => setReportProductId(e.target.value)}
                className="input-field"
              >
                <option value="">-- Pilih Produk --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>[{p.brand}] {p.name} - {p.size}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Jumlah (Qty)</label>
              <input
                type="number"
                min={1}
                value={reportQty}
                onChange={(e) => setReportQty(parseInt(e.target.value) || 1)}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Catatan Alasan</label>
              <textarea
                value={reportNotes}
                onChange={(e) => setReportNotes(e.target.value)}
                placeholder="Misal: Gudang asal bilang tertinggal, kirim besok..."
                className="input-field h-20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Foto Bukti Wajib (Kamera HP)</label>
              {reportPhoto ? (
                <img src={reportPhoto} alt="Bukti Selisih" className="w-full h-32 object-cover rounded-lg border" />
              ) : (
                <button type="button" onClick={() => void handleCaptureReportPhoto()} className="btn-outline w-full py-2 text-xs">
                  📸 Ambil Foto Bukti Selisih
                </button>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setShowReportModal(false)} className="btn-ghost flex-1">
                Batal
              </button>
              <button type="button" onClick={() => void submitReport()} className="btn-danger flex-1">
                Kirim Laporan ke Admin
              </button>
            </div>
          </div>
        </div>
      )}

      <SignatureModal
        isOpen={activeSigModal === 'penerima'}
        title={`Tanda Tangan Penerima (${user?.branch_name || ''})`}
        onClose={() => setActiveSigModal(null)}
        onSave={(data) => setSigPenerima(data)}
      />

      <SignatureModal
        isOpen={activeSigModal === 'sopir'}
        title="Tanda Tangan Sopir Transport"
        onClose={() => setActiveSigModal(null)}
        onSave={(data) => setSigSopir(data)}
      />
    </div>
  );
};