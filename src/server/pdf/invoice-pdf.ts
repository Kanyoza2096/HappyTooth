import { SimplePdf } from '@/server/pdf/simple-pdf';
import type { InvoiceWithDetails } from '@/types';
import type { ClinicProfile } from '@/lib/clinic-profile';
import { clinicInitials } from '@/lib/clinic-profile';
import { INVOICE_STATUS_LABELS, PAYMENT_METHOD_LABELS } from '@/lib/constants';

function money(amount: number, symbol: string): string {
  const n = Number.isFinite(amount) ? amount : 0;
  return `${symbol} ${n.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function fmtDate(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  for (const w of words) {
    const next = current ? `${current} ${w}` : w;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = w;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [''];
}

/**
 * Build a professional A4 invoice PDF.
 */
export function buildInvoicePdf(
  invoice: InvoiceWithDetails,
  clinic: ClinicProfile
): Uint8Array {
  const pdf = new SimplePdf();
  const left = pdf.left;
  const right = pdf.right;
  const width = pdf.contentWidth;
  let y = pdf.pageHeight - 48;

  const slate: [number, number, number] = [15, 23, 42];
  const muted: [number, number, number] = [100, 116, 139];
  const sky: [number, number, number] = [2, 132, 199];
  const line: [number, number, number] = [226, 232, 240];
  const accentBg: [number, number, number] = [240, 249, 255];

  // Header bar
  pdf.rect(0, pdf.pageHeight - 8, pdf.pageWidth, 8, { fill: sky });

  // Clinic identity
  const mark = clinic.logo_url ? '' : clinicInitials(clinic.clinic_name);
  if (mark) {
    pdf.rect(left, y - 22, 28, 28, { fill: sky });
    pdf.text(mark, left + 14, y - 12, {
      size: 10,
      bold: true,
      color: [255, 255, 255],
      align: 'center',
    });
  }

  const nameX = mark ? left + 36 : left;
  pdf.text(clinic.clinic_name, nameX, y - 4, { size: 14, bold: true, color: slate });
  if (clinic.clinic_tagline) {
    pdf.text(clinic.clinic_tagline, nameX, y - 18, { size: 9, color: muted });
  }

  const contactBits = [
    clinic.clinic_address,
    [clinic.clinic_city, clinic.clinic_country].filter(Boolean).join(', '),
    clinic.clinic_phone,
    clinic.clinic_email,
  ].filter(Boolean);

  let cy = y - 32;
  for (const bit of contactBits) {
    pdf.text(bit, nameX, cy, { size: 8, color: muted });
    cy -= 11;
  }
  if (clinic.clinic_tax_id) {
    pdf.text(`Tax ID: ${clinic.clinic_tax_id}`, nameX, cy, { size: 8, color: muted });
    cy -= 11;
  }

  // Invoice meta (right)
  pdf.text('INVOICE', right, y - 2, { size: 18, bold: true, color: sky, align: 'right' });
  pdf.text(invoice.invoice_number, right, y - 20, {
    size: 11,
    bold: true,
    color: slate,
    align: 'right',
  });
  pdf.text(`Status: ${INVOICE_STATUS_LABELS[invoice.status] || invoice.status}`, right, y - 34, {
    size: 9,
    color: muted,
    align: 'right',
  });
  pdf.text(`Issued: ${fmtDate(invoice.created_at)}`, right, y - 46, {
    size: 9,
    color: muted,
    align: 'right',
  });
  if (invoice.due_date) {
    pdf.text(`Due: ${fmtDate(invoice.due_date)}`, right, y - 58, {
      size: 9,
      color: muted,
      align: 'right',
    });
  }

  y = Math.min(cy, y - 70) - 16;
  pdf.line(left, y, right, y, { color: line, width: 1 });
  y -= 24;

  // Bill to
  pdf.rect(left, y - 52, width * 0.55, 60, { fill: accentBg });
  pdf.text('BILLED TO', left + 10, y - 8, { size: 8, bold: true, color: sky });
  const patientName = invoice.patient
    ? `${invoice.patient.first_name} ${invoice.patient.last_name}`
    : 'Patient';
  pdf.text(patientName, left + 10, y - 22, { size: 11, bold: true, color: slate });
  if (invoice.patient?.patient_number) {
    pdf.text(`ID: ${invoice.patient.patient_number}`, left + 10, y - 36, {
      size: 9,
      color: muted,
    });
  }
  if (invoice.patient?.phone) {
    pdf.text(`Phone: ${invoice.patient.phone}`, left + 10, y - 48, {
      size: 9,
      color: muted,
    });
  }

  y -= 80;

  // Table header
  const colDesc = left;
  const colQty = left + width * 0.58;
  const colUnit = left + width * 0.7;
  const colTotal = right;

  pdf.rect(left, y - 6, width, 18, { fill: [15, 23, 42] });
  pdf.text('#', left + 6, y, { size: 8, bold: true, color: [255, 255, 255] });
  pdf.text('Description', colDesc + 22, y, { size: 8, bold: true, color: [255, 255, 255] });
  pdf.text('Qty', colQty, y, { size: 8, bold: true, color: [255, 255, 255], align: 'right' });
  pdf.text('Unit', colUnit, y, { size: 8, bold: true, color: [255, 255, 255], align: 'right' });
  pdf.text('Total', colTotal, y, { size: 8, bold: true, color: [255, 255, 255], align: 'right' });
  y -= 22;

  const items = invoice.items || [];
  if (items.length === 0) {
    pdf.text('No line items', left + 6, y, { size: 9, color: muted });
    y -= 16;
  } else {
    items.forEach((item, idx) => {
      if (y < 120) {
        pdf.newPage();
        y = pdf.pageHeight - 48;
      }

      const descLines = wrapText(item.description || 'Item', 48);
      const rowHeight = Math.max(16, descLines.length * 11);

      if (idx % 2 === 1) {
        pdf.rect(left, y - rowHeight + 10, width, rowHeight, { fill: [248, 250, 252] });
      }

      pdf.text(String(idx + 1), left + 6, y, { size: 9, color: muted });
      descLines.forEach((line, li) => {
        pdf.text(line, colDesc + 22, y - li * 11, { size: 9, color: slate });
      });
      pdf.text(String(item.quantity), colQty, y, { size: 9, color: slate, align: 'right' });
      pdf.text(money(item.unit_price, clinic.currency_symbol), colUnit, y, {
        size: 9,
        color: slate,
        align: 'right',
      });
      pdf.text(money(item.line_total, clinic.currency_symbol), colTotal, y, {
        size: 9,
        bold: true,
        color: slate,
        align: 'right',
      });

      y -= rowHeight + 4;
      pdf.line(left, y + 8, right, y + 8, { color: line, width: 0.4 });
    });
  }

  y -= 12;

  // Totals block
  const totalsX = left + width * 0.55;
  const labelX = totalsX;
  const valueX = right;

  const rows: { label: string; value: string; bold?: boolean; color?: [number, number, number] }[] =
    [
      { label: 'Subtotal', value: money(invoice.subtotal, clinic.currency_symbol) },
    ];

  if (invoice.discount_amount > 0) {
    rows.push({
      label: 'Discount',
      value: `- ${money(invoice.discount_amount, clinic.currency_symbol)}`,
      color: [225, 29, 72],
    });
  }

  rows.push({
    label: 'Total',
    value: money(invoice.total, clinic.currency_symbol),
    bold: true,
  });
  rows.push({
    label: 'Amount paid',
    value: money(invoice.amount_paid, clinic.currency_symbol),
    color: [5, 150, 105],
  });
  rows.push({
    label: 'Balance due',
    value: money(invoice.outstanding_balance, clinic.currency_symbol),
    bold: true,
    color: [217, 119, 6],
  });

  for (const row of rows) {
    pdf.text(row.label, labelX, y, { size: 9, bold: row.bold, color: row.color || muted });
    pdf.text(row.value, valueX, y, {
      size: 9,
      bold: row.bold,
      color: row.color || slate,
      align: 'right',
    });
    y -= 14;
  }

  // Payments
  if (invoice.payments && invoice.payments.length > 0) {
    y -= 10;
    pdf.line(left, y + 8, right, y + 8, { color: line, width: 1 });
    y -= 8;
    pdf.text('PAYMENT HISTORY', left, y, { size: 9, bold: true, color: slate });
    y -= 14;
    for (const p of invoice.payments) {
      if (y < 80) {
        pdf.newPage();
        y = pdf.pageHeight - 48;
      }
      const method = PAYMENT_METHOD_LABELS[p.method] || p.method;
      const lineText = `${money(p.amount, clinic.currency_symbol)}  ·  ${method}  ·  ${fmtDate(p.created_at)}${
        p.reference ? `  ·  Ref: ${p.reference}` : ''
      }`;
      pdf.text(lineText, left, y, { size: 8, color: muted });
      y -= 12;
    }
  }

  // Notes
  if (invoice.notes) {
    y -= 8;
    pdf.text('Notes', left, y, { size: 9, bold: true, color: slate });
    y -= 12;
    for (const line of wrapText(invoice.notes, 90)) {
      pdf.text(line, left, y, { size: 8, color: muted });
      y -= 11;
    }
  }

  // Footer
  const footerY = 36;
  pdf.line(left, footerY + 16, right, footerY + 16, { color: line, width: 0.6 });
  const footer =
    clinic.invoice_footer ||
    'Thank you for choosing our clinic.';
  const footerLines = wrapText(footer, 95);
  let fy = footerY + 4;
  for (const fl of footerLines.slice(0, 2)) {
    pdf.text(fl, pdf.pageWidth / 2, fy, { size: 8, color: muted, align: 'center' });
    fy -= 10;
  }
  pdf.text(
    `${clinic.clinic_name}  ·  Generated ${fmtDate(new Date().toISOString())}`,
    pdf.pageWidth / 2,
    18,
    { size: 7, color: [148, 163, 184], align: 'center' }
  );

  return pdf.build();
}
