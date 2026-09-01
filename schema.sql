-- SKEMA DATABASE GUDANGHUB TRANSFER (SUPABASE POSTGRESQL)

-- 1. Cabang Toko
CREATE TABLE IF NOT EXISTS branches (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO branches (id, name, address) VALUES
('CB001', 'Toko Nasional Kitchen Eltari', 'Jl. Eltari, Kupang'),
('CB002', 'Toko Perabot Mama Oesapa', 'Jl. Oesapa, Kupang'),
('CB003', 'Toko Perabot Mama TDM', 'Jl. TDM, Kupang'),
('CB004', 'Toko Perabot Mama Kefamenanu', 'Jl. Utama, Kefamenanu')
ON CONFLICT (id) DO NOTHING;

-- 2. Master Produk
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- 3. Surat Jalan / Transfer Order (TO)
CREATE TABLE IF NOT EXISTS transfer_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- 4. Detail Barang Transfer
CREATE TABLE IF NOT EXISTS transfer_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_id UUID REFERENCES transfer_orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    qty_planned INT NOT NULL,
    qty_loaded INT DEFAULT 0,
    qty_received INT DEFAULT 0,
    notes TEXT
);

-- 5. Laporan Selisih & Karantina (Wajib Foto & Approval Admin)
CREATE TABLE IF NOT EXISTS transfer_discrepancies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_id UUID REFERENCES transfer_orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    type TEXT NOT NULL, -- 'missing' | 'excess' | 'wrong_item' | 'damaged' | 'unknown_item'
    qty_diff INT NOT NULL,
    photo_proof_url TEXT NOT NULL,
    notes TEXT,
    admin_status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
    resolved_by TEXT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Hutang Kirim (Backorder)
CREATE TABLE IF NOT EXISTS backorders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_id UUID REFERENCES transfer_orders(id),
    product_id UUID REFERENCES products(id),
    origin_branch_id TEXT REFERENCES branches(id),
    dest_branch_id TEXT REFERENCES branches(id),
    qty_owed INT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'fulfilled'
    created_at TIMESTAMPTZ DEFAULT now()
);
