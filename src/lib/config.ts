export const APP = {
  name: 'GudangHub Transfer',
  version: '2.0.0',
  company: 'PT Central Perabot Utama',
  location: 'NTT',
};

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export type UserRole = 'superadmin' | 'checker' | 'penerima';

export interface Branch {
  id: string;
  name: string;
  address: string;
  type: 'pusat' | 'toko';
}

export interface Profile {
  id: string;
  name: string;
  role: UserRole;
  branch_id?: string | null;
  branch_name?: string;
}

export const BRANCHES: Branch[] = [
  { id: 'CB000', name: 'Gudang Pusat', address: 'Jl. Pusat, Kupang', type: 'pusat' },
  { id: 'CB001', name: 'Toko Nasional Kitchen Eltari', address: 'Jl. Eltari, Kupang', type: 'toko' },
  { id: 'CB002', name: 'Toko Perabot Mama Oesapa', address: 'Jl. Oesapa, Kupang', type: 'toko' },
  { id: 'CB003', name: 'Toko Perabot Mama TDM', address: 'Jl. TDM, Kupang', type: 'toko' },
  { id: 'CB004', name: 'Toko Perabot Mama Kefamenanu', address: 'Jl. Utama, Kefamenanu', type: 'toko' },
];

export const GUDANG_PUSAT_ID = 'CB000';

export type TransferStatus = 'draft' | 'loading' | 'in_transit' | 'receiving' | 'discrepancy' | 'completed' | 'cancelled';

export type DiscrepancyType = 'missing' | 'excess' | 'wrong_item' | 'damaged' | 'unknown_item';

export type DiscrepancyAdminStatus = 'pending' | 'approved' | 'rejected';

export const STATUS_LABELS: Record<TransferStatus, string> = {
  draft: 'Draft',
  loading: 'Sedang Muat',
  in_transit: 'Dalam Perjalanan',
  receiving: 'Sedang Bongkar',
  discrepancy: 'Ada Selisih',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
};

export const STATUS_COLORS: Record<TransferStatus, string> = {
  draft: 'badge-info',
  loading: 'badge-warning',
  in_transit: 'badge-warning',
  receiving: 'badge-info',
  discrepancy: 'badge-danger',
  completed: 'badge-success',
  cancelled: 'badge-danger',
};

export const DISCREPANCY_LABELS: Record<DiscrepancyType, string> = {
  missing: 'Barang Kurang',
  excess: 'Barang Lebih',
  wrong_item: 'Barang Keliru',
  damaged: 'Barang Rusak',
  unknown_item: 'Barang Tak Dikenal',
};

export function getBranchName(id: string): string {
  return BRANCHES.find((b) => b.id === id)?.name || id;
}