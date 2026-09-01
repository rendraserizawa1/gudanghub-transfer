import type { Product, TransferOrder } from '../types';

export const DEMO_PRODUCTS: Product[] = [
  { id: 'p1', sku: 'KRS-NPL-001', barcode: '899100100101', name: 'Kursi Plastik Horeka', brand: 'Napoli', size: 'Standar', color: 'Hijau', category: 'Plastik', unit: 'PCS' },
  { id: 'p2', sku: 'KRS-NPL-002', barcode: '899100100102', name: 'Kursi Plastik Horeka', brand: 'Napoli', size: 'Standar', color: 'Biru', category: 'Plastik', unit: 'PCS' },
  { id: 'p3', sku: 'PNC-STN-030', barcode: '899200200301', name: 'Panci Stainless High-Grade', brand: 'Subron', size: '30 cm', color: 'Silver', category: 'Stainless', unit: 'PCS' },
  { id: 'p4', sku: 'PNC-STN-028', barcode: '899200200281', name: 'Panci Stainless High-Grade', brand: 'Subron', size: '28 cm', color: 'Silver', category: 'Stainless', unit: 'PCS' },
  { id: 'p5', sku: 'RAK-PRG-003', barcode: '89930030001', name: 'Rak Piring Plastik 3 Susun', brand: 'Lion Star', size: '3 Susun', color: 'Merah', category: 'Plastik', unit: 'SET' },
];

export const DEMO_TRANSFERS: TransferOrder[] = [
  {
    id: 'to-101',
    order_no: 'TO/2026/09/001',
    origin_branch_id: 'CB001',
    dest_branch_id: 'CB004',
    status: 'in_transit',
    created_by: 'Admin Pusat',
    driver_name: 'Pak Budi',
    truck_plate: 'DH 8892 AA',
    created_at: '2026-09-01 08:30',
    items: [
      { id: 'ti-1', transfer_id: 'to-101', product_id: 'p1', product: DEMO_PRODUCTS[0], qty_planned: 10, qty_loaded: 10, qty_received: 0 },
      { id: 'ti-2', transfer_id: 'to-101', product_id: 'p3', product: DEMO_PRODUCTS[2], qty_planned: 5, qty_loaded: 5, qty_received: 0 },
    ],
  },
  {
    id: 'to-102',
    order_no: 'TO/2026/09/002',
    origin_branch_id: 'CB001',
    dest_branch_id: 'CB004',
    status: 'discrepancy',
    created_by: 'Admin Pusat',
    driver_name: 'Pak Yono',
    truck_plate: 'DH 7123 BB',
    created_at: '2026-08-31 14:15',
    items: [
      { id: 'ti-3', transfer_id: 'to-102', product_id: 'p2', product: DEMO_PRODUCTS[1], qty_planned: 20, qty_loaded: 20, qty_received: 18 },
    ],
    discrepancies: [
      {
        id: 'disc-1',
        transfer_id: 'to-102',
        product_id: 'p2',
        product: DEMO_PRODUCTS[1],
        type: 'missing',
        qty_diff: -2,
        photo_proof_url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=400',
        notes: 'Tertinggal 2 pcs di gudang asal El Tari',
        admin_status: 'pending',
        created_at: '2026-08-31 17:00',
      },
    ],
  },
];
