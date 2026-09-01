export interface CapturedPhoto {
  dataUrl: string;
  timestamp: number;
  latitude?: number;
  longitude?: number;
}

export async function capturePhoto(): Promise<CapturedPhoto> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) { reject(new Error('No file selected')); return; }

      const reader = new FileReader();
      reader.onload = async () => {
        const photo: CapturedPhoto = {
          dataUrl: reader.result as string,
          timestamp: Date.now(),
        };

        try {
          const pos = await new Promise<GeolocationPosition>((res, rej) =>
            navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
          );
          photo.latitude = pos.coords.latitude;
          photo.longitude = pos.coords.longitude;
        } catch {}

        resolve(photo);
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    };

    input.click();
  });
}

export function addWatermark(
  dataUrl: string,
  text: string,
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);

      const fontSize = Math.max(14, img.width * 0.025);
      ctx.font = `bold ${fontSize}px monospace`;
      ctx.fillStyle = 'rgba(255,255,0,0.85)';
      ctx.strokeStyle = 'rgba(0,0,0,0.6)';
      ctx.lineWidth = 2;

      const lines = text.split('\n');
      const lineHeight = fontSize * 1.4;
      const startY = img.height - (lines.length * lineHeight) - 10;

      lines.forEach((line, i) => {
        const y = startY + (i * lineHeight);
        ctx.strokeText(line, 10, y);
        ctx.fillText(line, 10, y);
      });

      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.src = dataUrl;
  });
}
