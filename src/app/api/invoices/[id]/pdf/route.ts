import { NextResponse } from 'next/server';
import { getInvoice } from '@/server/services/financial-service';
import { getClinicProfile } from '@/server/services/settings-service';
import { buildInvoicePdf } from '@/server/pdf/invoice-pdf';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/invoices/:id/pdf
 * Returns an application/pdf download for the invoice.
 */
export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ error: 'Invoice id required' }, { status: 400 });
  }

  const result = await getInvoice(id);
  if (!result.success || !result.data) {
    return NextResponse.json(
      { error: result.error || 'Invoice not found' },
      { status: result.error?.includes('permission') || result.error?.includes('Authentication') ? 403 : 404 }
    );
  }

  const clinic = await getClinicProfile();
  const pdfBytes = buildInvoicePdf(result.data, clinic);

  const filename = `${result.data.invoice_number || 'invoice'}.pdf`.replace(
    /[^\w.\-]+/g,
    '_'
  );

  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, no-store',
      'Content-Length': String(pdfBytes.byteLength),
    },
  });
}
