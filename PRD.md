# PRD: GudangHub Transfer

**Version:** 2.0
**Status:** Approved
**Author:** PT Central Perabot Utama
**Date:** 2026-09-01

## 1. Product Overview

Web-based multi-branch warehouse distribution system. Barang berawal dari
Gudang Pusat didistribusikan ke toko cabang (boleh toko→toko). Mendukung
blind receiving, validasi barcode via kamera HP, selisih dengan approval
admin, tanda tangan 3 pihak, dan mode offline.

## 2. User Roles & Access

| Role | Login | Terikat | Tugas |
|---|---|---|---|
| `superadmin` | email+password | Semua | Akses penuh: master produk, kelola user, approve/reject selisih, semua transfer, semua cabang |
| `checker` | email+password | Gudang Pusat (`CB000`) | Validasi muat ke mobil, tanda tangan surat jalan utk transfer pusat→toko |
| `penerima` | email+password | 1 toko (`profiles.branch_id`) | Kirim (outgoing) + terima (incoming) tokonya, tanda tangan, lapor selisih ke admin |
| `sopir` | tidak login | — | Hanya nama (field) saat tanda tangan |

Akses data dibatasi: tiap akun hanya melihat data cabangnya sendiri.
Hanya `superadmin` akses semua cabang.

## 3. Alur Bisnis

### 3.1 Alur Tanda Tangan

- **Pusat→Toko:** `checker` (loading) → `sopir` (nama) → `penerima` toko tujuan (unloading)
- **Toko→Toko:** `penerima` toko asal (loading) → `sopir` (nama) → `penerima` toko tujuan (unloading)
- **Selisih:** `penerima` lapor (wajib foto) → `superadmin` approve/reject

### 3.2 Status Transfer

```
draft → loading → in_transit → receiving → completed
                                      → discrepancy → completed
```

### 3.3 Alur Distribusi

1. Pembuat surat jalan (superadmin/checker/penerima sesuai akses) pilih origin + dest
2. Origin bisa Gudang Pusat ATAU toko cabang
3. Muat: scan barcode tiap item + tanda tangan pengirim (checker/penerima) + nama sopir
4. Dalam perjalanan (truk + plat tercatat)
5. Bongkar: blind receive scan barcode + tanda tangan penerima
6. Selisih → laporan + foto → approval superadmin

## 4. Autentikasi (Supabase Auth)

- Login: email + password (`supabase.auth.signInWithPassword`)
- Session: `getSession()` + `onAuthStateChange`
- Profil: tabel `profiles` (role + branch_id), di-fetch setelah login
- User tanpa `profiles` → tolak akses
- Route guard: `ProtectedRoute` (login) + `RoleRoute` (role & branch)
- Matikan email confirmation utk akun demo

## 5. Database

### Tabel (existing + baru)

- `branches` (+ kolom `type`: `'pusat'|'toko'`; seed `CB000` Gudang Pusat)
- `profiles` (BARU): id FK auth.users, name, role, branch_id
- `products`, `transfer_orders`, `transfer_order_items`,
  `transfer_discrepancies`, `backorders` (tidak berubah)

### RLS

- `branches`: baca semua (login), tulis superadmin
- `profiles`: baca sendiri, tulis superadmin
- `products`: baca semua, tulis superadmin
- transfer/selisih: sesuai branch user

## 6. Scan Barcode (Kamera HP)

- `ScanLoading`/`ScanReceiving`: `html5-qrcode` auto-aktif saat mount, minta izin kamera
- Input ganda: **scan kamera** OR **ketik manual** (sinkron)
- Validasi hasil → `products.barcode`:
  - Cocok → tambah/update qty
  - Tidak cocok → error + "Tambah Produk Baru" (superadmin) / "Cari Produk Terdekat"
- Toggle kamera on/off

## 7. Fitur Utama (per halaman)

| Halaman | Akses | Fungsi |
|---|---|---|
| Login | publik | email+password |
| Dashboard | semua | statistik sesuai role/branch |
| Transfers (Surat Jalan) | semua (filter branch) | daftar + detail TO |
| Create Transfer | superadmin/checker/penerima | buat TO, pilih origin/dest |
| Scan Loading | checker (pusat) / penerima (asal) | scan barcode + tanda tangan |
| Scan Receiving | penerima (tujuan) | blind receive + tanda tangan + lapor selisih |
| Approval Selisih | superadmin | approve/reject |
| Master Produk | superadmin | CRUD + barcode print |

## 8. Offline

- Semua aksi create/update antri di IndexedDB
- Sync saat online kembali (`navigator.onLine`)
- Mode indikator Online/Offline di Dashboard

## 9. Teknologi

| Layer | Stack |
|---|---|
| Frontend | React 19 + TypeScript + Vite 8 |
| Styling | Tailwind CSS 3 |
| Routing | React Router v7 (HashRouter) |
| Auth/DB | Supabase (Auth + PostgreSQL + RLS) |
| Barcode | html5-qrcode (scan), JsBarcode (print) |
| Signature | signature_pad |
| Offline | IndexedDB |
| Deploy | GitHub Pages |

## 10. Deployment

- **Primary (Cloudflare Pages):** https://gudanghub-transfer.pages.dev/
- Build & deploy: `npm run deploy` = `vite build && wrangler pages deploy dist --project-name gudanghub-transfer --branch main`
- Env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- `vite.config.ts` base `'./'` (asset relatif, kompatibel Pages & GH Pages)
- OAuth login wrangler: `wrangler login` (akun silitongadimas@gmail.com)

## 11. Roadmap

- Phase 2: charts dashboard, notifikasi
- Phase 3: i18n EN/ID, aplikasi mobile