import React, { useState } from 'react';
import { DEMO_TRANSFERS, DEMO_PRODUCTS } from '../lib/demoData';
import { capturePhoto, addWatermark } from '../lib/camera';
import { SignatureModal } from '../components/SignatureModal';

export const ScanLoading: React.FC = () => {
  const [transfer] = useState(DEMO_TRANSFERS[0]);
  const [manualBarcode, setManualBarcode] = useState('');
  const [scannedItems, setScannedItems] = useState<Record<string, number>>({ p1: 10, p3: 5 });
  const [photoSeal, setPhotoSeal] = useState<string | null>(null);

  const [sigPengirim, setSigPengirim] = useState<string | null>(null);
  const [sigSopir, setSigSopir] = useState<string | null>(null);
  const [activeSigModal, setActiveSigModal] = useState<'pengirim' | 'sopir' | null>(null);

  const handleScan = (barcode: string) => {
    const product = DEMO_PRODUCTS.find((p) => p.barcode === barcode || p.sku === barcode);
    if (!product) {
      alert('⚠️ Barcode Tidak Dikenal dalam Master Produk!');
      return;
    }

    const itemInTransfer = transfer.items.find((i) => i.product_id === product.id);
    if (!itemInTransfer) {
      alert(`⚠️ Peringatan: Barang [${product.name}] Tidak Ada di Surat Jalan Ini!`);
      return;
    }

    setScannedItems((prev) => ({
      ...prev,
      [product.id]: (prev[product.id] || 0) + 1,
    }));
  };

  const handleCaptureSeal = async () => {
    try {
      const rawPhoto = await capturePhoto();
      const watermarked = await addWatermark(
        rawPhoto.dataUrl,
        `FOTO SEGEL MUAT - GUDANG EL TARI\nNo TO: ${transfer.order_no}\nWaktu: ${new Date().toLocaleString()}`
      );
      setPhotoSeal(watermarked);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Scan Muat Barang (Gudang Asal El Tari)</h2>
        <p className="text-xs text-gray-500">Scan fisik barang satu per satu sebelum dimasukkan ke dalam truk</p>
      </div>

      <div className="card space-y-3">
        <div className="flex items-center justify-between border-b pb-2">
          <span className="font-bold text-brand-700">{transfer.order_no}</span>
          <span className="badge badge-warning">Proses Muat</span>
        </div>

        <div className="text-xs space-y-1 text-gray-600">
          <p>Sopir: <span className="font-semibold text-gray-900">{transfer.driver_name}</span> ({transfer.truck_plate})</p>
          <p>Tujuan: <span className="font-semibold text-gray-900">Toko Perabot Mamaku Kefamenanu</span></p>
        </div>

        <div className="border-t pt-3 space-y-2">
          <label className="block text-xs font-semibold text-gray-700">Input / Scan Barcode Produk</label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Scan Barcode / Ketik Kode..."
              value={manualBarcode}
              onChange={(e) => setManualBarcode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleScan(manualBarcode);
                  setManualBarcode('');
                }
              }}
              className="input-field flex-1"
            />
            <button
              type="button"
              onClick={() => {
                handleScan(manualBarcode);
                setManualBarcode('');
              }}
              className="btn-primary text-xs"
            >
              Scan / Enter
            </button>
          </div>
        </div>

        <div className="border-t pt-3 space-y-2">
          <h3 className="text-xs font-bold text-gray-900">Progress Scan Muat Barang</h3>
          <div className="divide-y border rounded-lg overflow-hidden">
            {transfer.items.map((item) => {
              const loaded = scannedItems[item.product_id] || 0;
              const isComplete = loaded === item.qty_planned;
              return (
                <div key={item.id} className="p-3 bg-white flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-gray-900">[{item.product?.brand}] {item.product?.name}</p>
                    <p className="text-gray-500">Ukuran: {item.product?.size || '-'} | Warna: {item.product?.color || '-'}</p>
                    <p className="text-[10px] text-gray-400 font-mono">Barcode: {item.product?.barcode}</p>
                  </div>

                  <div className="text-right">
                    <span className={`font-bold ${isComplete ? 'text-success-600' : 'text-warning-600'}`}>
                      {loaded} / {item.qty_planned} {item.product?.unit}
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
            <button type="button" onClick={handleCaptureSeal} className="btn-outline w-full py-3 text-xs">
              📸 Ambil Foto Pintu Truk Terkunci / Bagasi
            </button>
          )}
        </div>

        <div className="border-t pt-3 space-y-2">
          <h3 className="text-xs font-bold text-gray-900">Tanda Tangan Digital 2 Pihak</h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setActiveSigModal('pengirim')}
              className="btn-outline text-xs py-2.5"
            >
              {sigPengirim ? '✓ TT Gudang Asal' : '✍️ TT Petugas Gudang'}
            </button>

            <button
              type="button"
              onClick={() => setActiveSigModal('sopir')}
              className="btn-outline text-xs py-2.5"
            >
              {sigSopir ? '✓ TT Sopir' : '✍️ TT Sopir Transport'}
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            if (!photoSeal) { alert('Wajib ambil foto segel truk!'); return; }
            if (!sigPengirim || !sigSopir) { alert('Wajib tanda tangan 2 pihak!'); return; }
            alert('Proses Muat Selesai! Status berubah menjadi IN TRANSIT.');
          }}
          className="btn-success w-full py-3 text-sm mt-4"
        >
          Konfirmasi Muat & Mobil Berangkat (In Transit)
        </button>
      </div>

      <SignatureModal
        isOpen={activeSigModal === 'pengirim'}
        title="Tanda Tangan Petugas Gudang Asal"
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
