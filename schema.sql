-- SKEMA DATABASE GUDANGHUB TRANSFER v2.0 (SUPABASE POSTGRESQL)

-- ============ TABLES ============

-- 1. Cabang Toko / Gudang Pusat
CREATE TABLE IF NOT EXISTS branches (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT,
    type TEXT DEFAULT 'toko' CHECK (type IN ('pusat','toko')),
    created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO branches (id, name, address, type) VALUES
('CB000', 'Gudang Pusat', 'Jl. Pusat, Kupang', 'pusat'),
('CB001', 'Toko Nasional Kitchen Eltari', 'Jl. Eltari, Kupang', 'toko'),
('CB002', 'Toko Perabot Mama Oesapa', 'Jl. Oesapa, Kupang', 'toko'),
('CB003', 'Toko Perabot Mama TDM', 'Jl. TDM, Kupang', 'toko'),
('CB004', 'Toko Perabot Mama Kefamenanu', 'Jl. Utama, Kefamenanu', 'toko')
ON CONFLICT (id) DO UPDATE SET type = EXCLUDED.type;

-- 2. Profil User (role & cabang, terhubung ke Supabase Auth)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('superadmin','checker','penerima')),
    branch_id TEXT REFERENCES branches(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Master Produk
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    sku TEXT UNIQUE NOT NULL,
    barcode TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    brand TEXT NOT NULL,
    size TEXT,
    color TEXT,
    category TEXT NOT NULL,
    unit TEXT NOT NULL DEFAULT 'PCS',
    photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Surat Jalan / Transfer Order (TO)
CREATE TABLE IF NOT EXISTS transfer_orders (
    id TEXT PRIMARY KEY,
    order_no TEXT UNIQUE NOT NULL,
    origin_branch_id TEXT REFERENCES branches(id),
    dest_branch_id TEXT REFERENCES branches(id),
    status TEXT NOT NULL DEFAULT 'draft',
    created_by TEXT NOT NULL,
    loaded_by TEXT,
    received_by TEXT,
    driver_name TEXT,
    truck_plate TEXT,
    photo_loading_seal TEXT,
    photo_unloading_seal TEXT,
    sign_pengirim TEXT,
    sign_sopir TEXT,
    sign_penerima TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    loaded_at TIMESTAMPTZ,
    received_at TIMESTAMPTZ
);

-- 5. Detail Barang Transfer
CREATE TABLE IF NOT EXISTS transfer_order_items (
    id TEXT PRIMARY KEY,
    transfer_id TEXT REFERENCES transfer_orders(id) ON DELETE CASCADE,
    product_id TEXT REFERENCES products(id),
    qty_planned INT NOT NULL,
    qty_loaded INT DEFAULT 0,
    qty_received INT DEFAULT 0,
    notes TEXT
);

-- 6. Laporan Selisih & Karantina
CREATE TABLE IF NOT EXISTS transfer_discrepancies (
    id TEXT PRIMARY KEY,
    transfer_id TEXT REFERENCES transfer_orders(id) ON DELETE CASCADE,
    product_id TEXT REFERENCES products(id),
    type TEXT NOT NULL,
    qty_diff INT NOT NULL,
    photo_proof_url TEXT NOT NULL,
    notes TEXT,
    admin_status TEXT NOT NULL DEFAULT 'pending',
    resolved_by TEXT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Hutang Kirim (Backorder)
CREATE TABLE IF NOT EXISTS backorders (
    id TEXT PRIMARY KEY,
    transfer_id TEXT REFERENCES transfer_orders(id),
    product_id TEXT REFERENCES products(id),
    origin_branch_id TEXT REFERENCES branches(id),
    dest_branch_id TEXT REFERENCES branches(id),
    qty_owed INT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============ RLS ============

-- Helper: cek apakah user login adalah superadmin (SECURITY DEFINER menghindari rekursi)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin');
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- PROFILES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS profiles_select_own ON profiles;
CREATE POLICY profiles_select_own ON profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin());
DROP POLICY IF EXISTS profiles_insert_admin ON profiles;
CREATE POLICY profiles_insert_admin ON profiles
  FOR INSERT WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS profiles_update_admin ON profiles;
CREATE POLICY profiles_update_admin ON profiles
  FOR UPDATE USING (public.is_admin());

-- BRANCHES
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS branches_select_all ON branches;
CREATE POLICY branches_select_all ON branches
  FOR SELECT USING (auth.role() IS NOT NULL);
DROP POLICY IF EXISTS branches_write_admin ON branches;
CREATE POLICY branches_write_admin ON branches
  FOR ALL USING (public.is_admin());

-- PRODUCTS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS products_select_all ON products;
CREATE POLICY products_select_all ON products
  FOR SELECT USING (auth.role() IS NOT NULL);
DROP POLICY IF EXISTS products_write_admin ON products;
CREATE POLICY products_write_admin ON products
  FOR ALL USING (public.is_admin());

-- TRANSFER_ORDERS
ALTER TABLE transfer_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS to_select ON transfer_orders;
CREATE POLICY to_select ON transfer_orders
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      public.is_admin()
      OR origin_branch_id IN (SELECT branch_id FROM profiles WHERE id = auth.uid())
      OR dest_branch_id IN (SELECT branch_id FROM profiles WHERE id = auth.uid())
    )
  );
DROP POLICY IF EXISTS to_insert ON transfer_orders;
CREATE POLICY to_insert ON transfer_orders
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS to_update ON transfer_orders;
CREATE POLICY to_update ON transfer_orders
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- TRANSFER_ORDER_ITEMS
ALTER TABLE transfer_order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS toi_select ON transfer_order_items;
CREATE POLICY toi_select ON transfer_order_items
  FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS toi_all ON transfer_order_items;
CREATE POLICY toi_all ON transfer_order_items
  FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- TRANSFER_DISCREPANCIES
ALTER TABLE transfer_discrepancies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS td_select ON transfer_discrepancies;
CREATE POLICY td_select ON transfer_discrepancies
  FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS td_insert ON transfer_discrepancies;
CREATE POLICY td_insert ON transfer_discrepancies
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS td_update_admin ON transfer_discrepancies;
CREATE POLICY td_update_admin ON transfer_discrepancies
  FOR UPDATE USING (public.is_admin());

-- BACKORDERS
ALTER TABLE backorders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS bo_select ON backorders;
CREATE POLICY bo_select ON backorders
  FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS bo_all ON backorders;
CREATE POLICY bo_all ON backorders
  FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
