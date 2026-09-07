import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { STATUS_LABELS, getBranchName } from './config';
import type { TransferRecord } from './supabase';

export interface ExportRow {
  order_no: string;
  asal: string;
  tujuan: string;
  status: string;
  sopir: string;
  plat: string;
  dibuat: string;
}

export function rowsToExport(records: TransferRecord[]): ExportRow[] {
  return records.map((t) => ({
    order_no: t.order_no,
    asal: getBranchName(t.origin_branch_id),
    tujuan: getBranchName(t.dest_branch_id),
    status: STATUS_LABELS[t.status as keyof typeof STATUS_LABELS] || t.status,
    sopir: t.driver_name || '-',
    plat: t.truck_plate || '-',
    dibuat: new Date(t.created_at).toLocaleString('id-ID'),
  }));
}

export function downloadXLSX(records: TransferRecord[], filename = 'my-report-surat-jalan.xlsx') {
  const rows = rowsToExport(records);
  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [{ wch: 18 }, { wch: 26 }, { wch: 28 }, { wch: 16 }, { wch: 18 }, { wch: 14 }, { wch: 22 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Surat Jalan');
  XLSX.writeFile(wb, filename);
}

export function downloadPDF(records: TransferRecord[], title = 'MY REPORT — Rekap Surat Jalan') {
  const rows = rowsToExport(records);
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  doc.setFontSize(14);
  doc.text(title, 40, 36);
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`PT Central Perabot Utama • dicetak ${new Date().toLocaleString('id-ID')} • ${rows.length} data`, 40, 52);

  autoTable(doc, {
    startY: 64,
    head: [['No. SJ', 'Asal', 'Tujuan', 'Status', 'Sopir', 'Plat', 'Dibuat']],
    body: rows.map((r) => [r.order_no, r.asal, r.tujuan, r.status, r.sopir, r.plat, r.dibuat]),
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: [10, 14, 26], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [245, 246, 248] },
    didDrawPage: () => {
      doc.setDrawColor(255, 107, 0);
      doc.line(40, 58, 800, 58);
    },
  });
  doc.save('my-report-surat-jalan.pdf');
}