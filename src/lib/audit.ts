import { supabase } from './supabase';
import { ADMIN_API_URL } from './config';

/** Catat aksi ke audit trail (fire-and-forget, tidak pernah blok alur utama). */
export async function logAction(action: string, detail: string): Promise<void> {
  try {
    if (!supabase) return;
    const { data } = await supabase.auth.getSession();
    const t = data.session?.access_token;
    if (!t) return;
    await fetch(`${ADMIN_API_URL}/log`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, detail }),
    });
  } catch {
    // silent
  }
}