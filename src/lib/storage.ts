import { supabase } from './supabase';

/**
 * Upload foto (dataURL) ke Supabase Storage bucket my-report-photos.
 * Return URL publik. Gagal → fallback kembalikan dataURL asli (agar alur tak pernah macet).
 */
export async function uploadPhoto(dataUrl: string, folder: 'discrepancies' | 'loading' | 'unloading'): Promise<string> {
  if (!supabase) return dataUrl;
  try {
    const [meta, b64] = dataUrl.split(',');
    if (!b64) return dataUrl;
    const mime = meta.match(/data:(.*?);/)?.[1] || 'image/jpeg';
    const ext = mime === 'image/png' ? 'png' : 'jpg';
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const { error } = await supabase.storage
      .from('my-report-photos')
      .upload(path, bytes, { contentType: mime, upsert: false });
    if (error) return dataUrl;
    const { data: pub } = supabase.storage.from('my-report-photos').getPublicUrl(path);
    return pub?.publicUrl || dataUrl;
  } catch {
    return dataUrl;
  }
}