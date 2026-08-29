import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  Receipt,
  CreditCard,
  Printer,
  CheckCircle2,
  AlertCircle,
  Building,
  User,
} from 'lucide-react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { getInvoice } from '@/server/services/financial-service';
import { getClinicProfile } from '@/server/services/settings-service';
import { clinicInitials } from '@/lib/clinic-profile';
import { recordPaymentAction } from '@/features/billing/actions';
import { getAuthenticatedUser } from '@/server/auth/session';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import {
  INVOICE_STATUS_LABELS,
  INVOICE_STATUS_COLORS,
  PAYMENT_METHOD_LABELS,
} from '@/lib/constants';

interface InvoiceDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  const user = await getAuthenticatedUser();
  const clinic = await getClinicProfile();
  const { id } = await params;

  const result = await getInvoice(id);
  if (!result.success || !result.data) {
    notFound();
  }

  const invoice = result.data;
  const isPaid = invoice.status === 'paid' || invoice.outstanding_balance <= 0;

  return (
    <DashboardShell user={user} clinic={clinic}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
          <div className="flex items-center gap-3">
            <Link href="/invoices">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                  Invoice {invoice.invoice_number}
                </h1>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${INVOICE_STATUS_COLORS[invoice.status]}`}>
                  {INVOICE_STATUS_LABELS[invoice.status]}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Issued on {formatDate(invoice.created_at)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a href={`/api/invoices/${invoice.id}/pdf`} download>
              <Button size="sm" className="gap-1.5 shadow-sm">
                <Printer className="h-4 w-4" />
                Download PDF
              </Button>
            </a>
            <Link href={`/patients/${invoice.patient_id}`}>
              <Button size="sm" variant="outline">
                Patient Profile
              </Button>
            </Link>
          </div>
        </div>

        {/* Invoice Printable Sheet */}
        <Card className="shadow-sm border-slate-200/90 dark:border-slate-800">
          <CardContent className="p-6 sm:p-8 space-y-8">
            {/* Header: Practice info & Invoice meta */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 border-b border-slate-100 dark:border-slate-800 pb-6">
              <div>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold text-sm overflow-hidden">
                    {clinic.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={clinic.logo_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      clinicInitials(clinic.clinic_name)
                    )}
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {clinic.clinic_name}
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {[clinic.clinic_address, clinic.clinic_city, clinic.clinic_phone]
                    .filter(Boolean)
                    .join(' · ') || clinic.clinic_tagline}
                </p>
              </div>

              <div className="text-left sm:text-right text-xs space-y-1">
                <p className="font-mono font-bold text-base text-sky-600 dark:text-sky-400">
                  {invoice.invoice_number}
                </p>
                <p className="text-slate-500">Date: {formatDate(invoice.created_at)}</p>
                {invoice.due_date && (
                  <p className="text-slate-500">Due Date: {formatDate(invoice.due_date)}</p>
                )}
              </div>
            </div>

            {/* Billed To Patient Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 space-y-1">
                <p className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                  Billed To
                </p>
                <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  {invoice.patient?.first_name} {invoice.patient?.last_name}
                </p>
                <p className="text-slate-600 dark:text-slate-400">
                  Patient ID: <span className="font-mono">{invoice.patient?.patient_number}</span>
                </p>
                {invoice.patient?.phone && (
                  <p className="text-slate-600 dark:text-slate-400">Phone: {invoice.patient.phone}</p>
                )}
              </div>
            </div>

            {/* Invoice Line Items */}
            <div className="overflow-hidden border border-slate-100 dark:border-slate-800 rounded-lg">
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-900">
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-center">Qty</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Line Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.items?.map((item, idx) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-xs text-slate-400">{idx + 1}</TableCell>
                      <TableCell className="font-medium text-xs text-slate-900 dark:text-slate-100">
                        {item.description}
                      </TableCell>
                      <TableCell className="text-center font-mono text-xs">{item.quantity}</TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        {formatCurrency(item.unit_price)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold text-xs">
                        {formatCurrency(item.line_total)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Summary Totals */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
              <div className="text-xs text-slate-500 max-w-sm">
                {invoice.notes && (
                  <p className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900">
                    <span className="font-semibold">Notes:</span> {invoice.notes}
                  </p>
                )}
              </div>

              <div className="w-full sm:w-72 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800 text-slate-500">
                  <span>Subtotal:</span>
                  <span className="font-mono font-medium">{formatCurrency(invoice.subtotal)}</span>
                </div>
                {invoice.discount_amount > 0 && (
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800 text-rose-600">
                    <span>Discount:</span>
                    <span className="font-mono font-medium">- {formatCurrency(invoice.discount_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-slate-100">
                  <span>Total Amount Due:</span>
                  <span className="font-mono">{formatCurrency(invoice.total)}</span>
                </div>
                <div className="flex justify-between py-1 text-emerald-600 font-medium">
                  <span>Amount Paid:</span>
                  <span className="font-mono">{formatCurrency(invoice.amount_paid)}</span>
                </div>
                <div className="flex justify-between py-2 border-t-2 border-slate-900 dark:border-slate-100 text-base font-bold text-amber-600 dark:text-amber-400">
                  <span>Balance Due:</span>
                  <span className="font-mono">{formatCurrency(invoice.outstanding_balance)}</span>
                </div>
              </div>
            </div>

            {/* Payments History on this Invoice */}
            {invoice.payments && invoice.payments.length > 0 && (
              <div className="border-t border-slate-100 dark:border-slate-800 pt-6 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  Payment History
                </h4>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {invoice.payments.map((p) => (
                    <div key={p.id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {formatCurrency(p.amount)}
                        </span>
                        <span className="text-slate-400 ml-2">
                          via {PAYMENT_METHOD_LABELS[p.method] || p.method} on {formatDate(p.created_at)}
                        </span>
                        {p.reference && (
                          <span className="text-slate-400 font-mono ml-2">Ref: {p.reference}</span>
                        )}
                      </div>
                      <Badge variant="success" className="text-[10px]">
                        Payment Verified
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Record Payment Action Card (if not fully paid) */}
        {!isPaid && (
          <Card className="shadow-sm no-print border-emerald-200 bg-emerald-50/30 dark:border-emerald-900/40 dark:bg-emerald-950/10">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <CreditCard className="h-4 w-4" />
                <CardTitle className="text-base">Record Payment & Issue Receipt</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Accept cash, mobile money, card, or bank transfer against this invoice. Collision-safe receipt will be generated automatically.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={recordPaymentAction} className="space-y-4">
                <input type="hidden" name="invoice_id" value={invoice.id} />
                <input type="hidden" name="patient_id" value={invoice.patient_id} />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Payment Amount <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      name="amount"
                      required
                      defaultValue={invoice.outstanding_balance}
                      max={invoice.outstanding_balance}
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Payment Method <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="method"
                      required
                      defaultValue="cash"
                      className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-slate-800 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                    >
                      <option value="cash">Cash</option>
                      <option value="mobile_money">Mobile Money (Airtel / TNM Mpamba)</option>
                      <option value="card">Credit / Debit Card</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Transaction Reference / Notes
                    </label>
                    <Input name="reference" placeholder="e.g. TXN987654321" />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-sm">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Confirm Payment & Print Receipt</span>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardShell>
  );
}
