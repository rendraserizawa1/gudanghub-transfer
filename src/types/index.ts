import type { UserRole } from '../lib/config';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  branch_id?: string;
  branch_name?: string;
}

export interface Product {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  brand: string;
  size?: string;
  color?: string;
  category: string;
  unit: string;
  photo_url?: string;
}

export interface TransferOrderItem {
  id: string;
  transfer_id: string;
  product_id: string;
  product?: Product;
  qty_planned: number;
  qty_loaded: number;
  qty_received: number;
  notes?: string;
}

export interface TransferOrder {
  id: string;
  order_no: string;
  origin_branch_id: string;
  dest_branch_id: string;
  status: 'draft' | 'loading' | 'in_transit' | 'receiving' | 'discrepancy' | 'completed' | 'cancelled';
  created_by: string;
  loaded_by?: string;
  received_by?: string;
  driver_name?: string;
  truck_plate?: string;
  photo_loading_seal?: string;
  photo_unloading_seal?: string;
  sign_pengirim?: string;
  sign_sopir?: string;
  sign_penerima?: string;
  created_at: string;
  loaded_at?: string;
  received_at?: string;
  items: TransferOrderItem[];
  discrepancies?: Discrepancy[];
}

export interface Discrepancy {
  id: string;
  transfer_id: string;
  product_id?: string;
  product?: Product;
  type: 'missing' | 'excess' | 'wrong_item' | 'damaged' | 'unknown_item';
  qty_diff: number;
  photo_proof_url: string;
  notes?: string;
  admin_status: 'pending' | 'approved' | 'rejected';
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
}

export interface Backorder {
  id: string;
  transfer_id: string;
  product_id: string;
  product?: Product;
  origin_branch_id: string;
  dest_branch_id: string;
  qty_owed: number;
  status: 'pending' | 'fulfilled';
  created_at: string;
}
