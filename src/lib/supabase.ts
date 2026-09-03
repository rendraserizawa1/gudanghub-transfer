import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config';

export const supabase: SupabaseClient | null = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

export async function fetchProfile(userId: string) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, role, branch_id')
    .eq('id', userId)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

export async function fetchProducts(search = '') {
  if (!supabase) return [];
  let query = supabase.from('products').select('*').order('name');
  if (search) query = query.or(`name.ilike.%${search}%,barcode.ilike.%${search}%,sku.ilike.%${search}%`);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function findProductByBarcode(barcode: string) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('barcode', barcode)
    .maybeSingle();
  return error ? null : data;
}

export interface TransferRecord {
  id: string;
  order_no: string;
  origin_branch_id: string;
  dest_branch_id: string;
  status: string;
  driver_name: string;
  truck_plate: string;
  created_at: string;
}

export async function fetchTransfers(branchIds: string[] | null): Promise<TransferRecord[]> {
  if (!supabase) return [];
  let query = supabase
    .from('transfer_orders')
    .select('id, order_no, origin_branch_id, dest_branch_id, status, driver_name, truck_plate, created_at')
    .order('created_at', { ascending: false })
    .limit(100);
  if (branchIds) query = query.or(`origin_branch_id.in.(${branchIds.join(',')}),dest_branch_id.in.(${branchIds.join(',')})`);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as TransferRecord[];
}

export async function createTransfer(payload: {
  order_no: string;
  origin_branch_id: string;
  dest_branch_id: string;
  created_by: string;
  driver_name: string;
  truck_plate: string;
}) {
  if (!supabase) throw new Error('no supabase');
  const { data, error } = await supabase.from('transfer_orders').insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function insertTransferItems(items: Array<{ transfer_id: string; product_id: string; qty_planned: number }>) {
  if (!supabase) throw new Error('no supabase');
  const { error } = await supabase.from('transfer_order_items').insert(items);
  if (error) throw error;
}