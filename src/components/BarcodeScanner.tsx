import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface BarcodeScannerProps {
  onDetected: (barcode: string) => void;
  placeholder?: string;
  buttonLabel?: string;
}

const CAMERA_ID = 'barcode-scanner-region';

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  onDetected,
  placeholder = 'Scan Barcode / Ketik Kode...',
  buttonLabel = 'Scan / Enter',
}) => {
  const [cameraOn, setCameraOn] = useState(false);
  const [manual, setManual] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastDetectionRef = useRef(0);

  useEffect(() => {
    return () => {
      if (scannerRef.current) void scannerRef.current.stop().catch(() => undefined);
    };
  }, []);

  const startCamera = async () => {
    if (!cameraOn) {
      try {
        if (!scannerRef.current) {
          scannerRef.current = new Html5Qrcode(CAMERA_ID);
        }
        await scannerRef.current.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 150 } },
          (decoded) => {
            const now = Date.now();
            if (now - lastDetectionRef.current < 1500) return;
            lastDetectionRef.current = now;
            onDetected(decoded);
          },
          () => undefined
        );
        setCameraOn(true);
      } catch (e) {
        alert(`Gagal membuka kamera. Izin kamera wajib diaktifkan. ${e instanceof Error ? e.message : ''}`);
      }
    } else {
      await scannerRef.current?.stop().catch(() => undefined);
      setCameraOn(false);
    }
  };

  const submitManual = () => {
    if (!manual.trim()) return;
    onDetected(manual.trim());
    setManual('');
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder={placeholder}
          value={manual}
          onChange={(e) => setManual(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submitManual();
          }}
          className="input-field flex-1"
        />
        <button type="button" onClick={submitManual} className="btn-primary text-xs">
          {buttonLabel}
        </button>
      </div>

      <button
        type="button"
        onClick={() => void startCamera()}
        className={`w-full py-2.5 text-xs ${cameraOn ? 'btn-danger' : 'btn-outline'}`}
      >
        {cameraOn ? '📷 Matikan Kamera Scan' : '📷 Nyalakan Kamera Scan Barcode'}
      </button>

      <div id={CAMERA_ID} className={cameraOn ? 'rounded-lg overflow-hidden border' : 'hidden'} />
    </div>
  );
};