import React, { useRef } from 'react';
import SignaturePad from 'signature_pad';

interface SignatureModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  onSave: (dataUrl: string) => void;
}

export const SignatureModal: React.FC<SignatureModalProps> = ({ isOpen, title, onClose, onSave }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const padRef = useRef<SignaturePad | null>(null);

  React.useEffect(() => {
    if (isOpen && canvasRef.current) {
      padRef.current = new SignaturePad(canvasRef.current, {
        backgroundColor: 'rgb(255, 255, 255)',
        penColor: 'rgb(0, 0, 0)',
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClear = () => {
    padRef.current?.clear();
  };

  const handleSave = () => {
    if (padRef.current?.isEmpty()) {
      alert('Tanda tangan belum diisi!');
      return;
    }
    const dataUrl = padRef.current?.toDataURL() || '';
    onSave(dataUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="card w-full max-w-md bg-white p-4">
        <h3 className="text-base font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-xs text-gray-500 mb-4">Silakan tanda tangan di dalam kotak berikut:</p>
        
        <div className="border border-gray-300 rounded-lg overflow-hidden bg-white mb-4">
          <canvas ref={canvasRef} width={380} height={180} className="w-full touch-none" />
        </div>

        <div className="flex gap-2">
          <button type="button" onClick={handleClear} className="btn-outline flex-1 text-xs">
            Hapus / Ulangi
          </button>

          <button type="button" onClick={onClose} className="btn-ghost flex-1 text-xs">
            Batal
          </button>

          <button type="button" onClick={handleSave} className="btn-primary flex-1 text-xs">
            Simpan Tanda Tangan
          </button>
        </div>
      </div>
    </div>
  );
};
