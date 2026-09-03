// Seed akun Supabase Auth + profiles untuk GudangHub Transfer v2
// Jalankan: node scripts/seed-auth.mjs
// Butuh env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error('Set SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false } });

const users = [
  { email: 'superadmin@gh.local', password: 'superadmin123', name: 'Super Admin', role: 'superadmin', branch_id: null },
  { email: 'checker@gh.local', password: 'checker123', name: 'Checker Gudang Pusat', role: 'checker', branch_id: 'CB000' },
  { email: 'penerima-kefa@gh.local', password: 'penerima123', name: 'Penerima Kefamenanu', role: 'penerima', branch_id: 'CB004' },
];

for (const u of users) {
  // Buat user auth (asumsi email confirmation disabled utk demo)
  const { data, error } = await admin.auth.admin.createUser({
    email: u.email,
    password: u.password,
    email_confirm: true,
    user_metadata: { name: u.name, role: u.role, branch_id: u.branch_id },
  });
  if (error) {
    console.error(`Gagal buat ${u.email}:`, error.message);
    continue;
  }
  // Insert profil
  const { error: pErr } = await admin.from('profiles').upsert({
    id: data.user.id,
    name: u.name,
    role: u.role,
    branch_id: u.branch_id,
  });
  if (pErr) console.error(`Gagal profil ${u.email}:`, pErr.message);
  else console.log(`OK ${u.email} -> role=${u.role} branch=${u.branch_id || '-'}`);
}