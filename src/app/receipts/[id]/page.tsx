import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Printer, CheckCircle2 } from 'lucide-react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getReceipt } from '@/server/services/financial-service';
import { getClinicProfile } from '@/server/services/settings-service';
import { clinicInitials } from '@/lib/clinic-profile';
import { getAuthenticatedUser } from '@/server/auth/session';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { PAYMENT_METHOD_LABELS } from '@/lib/constants';

interface ReceiptPageProps {
  params: Promise<{ id: string }>;
}

export default async function ReceiptPage({ params }: ReceiptPageProps) {
  const user = await getAuthenticatedUser();
  const clinic = await getClinicProfile();
  const { id } = await params;

  const result = await getReceipt(id);
  if (!result.success || !result.data) {
    notFound();
  }

  const receipt = result.data;

  return (
    <DashboardShell user={user} clinic={clinic}>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between no-print">
          <div className="flex items-center gap-3">
            <Link href="/invoices">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                Official Payment Receipt
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Deterministic, tamper-evident financial record.
              </p>
            </div>
          </div>
        </div>

        {/* Printable Receipt Card */}
        <Card className="shadow-lg border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <CardContent className="p-8 sm:p-10 space-y-8">
            {/* Header */}
            <div className="text-center space-y-1 border-b border-slate-200 dark:border-slate-800 pb-6">
              <div className="flex items-center justify-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold text-sm overflow-hidden">
                  {clinic.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={clinic.logo_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    clinicInitials(clinic.clinic_name)
                  )}
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                  {clinic.clinic_name.toUpperCase()}
                </h2>
              </div>
              <p className="text-xs text-slate-500">Official Payment Receipt</p>
              <p className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400 pt-2">
                RECEIPT: {receipt.receipt_number}
              </p>
            </div>

            {/* Receipt Body */}
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Date & Time:</span>
                <span className="font-semibold text-right">{formatDateTime(receipt.created_at)}</span>
              </div>

              <div className="grid grid-cols-2 py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Patient Name:</span>
                <span className="font-semibold text-right text-slate-900 dark:text-slate-100">
                  {receipt.patient?.first_name} {receipt.patient?.last_name} ({receipt.patient?.patient_number})
                </span>
              </div>

              <div className="grid grid-cols-2 py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Invoice Reference:</span>
                <span className="font-mono font-semibold text-right text-sky-600 dark:text-sky-400">
                  {receipt.invoice?.invoice_number}
                </span>
              </div>

              <div className="grid grid-cols-2 py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Payment Method:</span>
                <span className="font-semibold text-right capitalize">
                  {PAYMENT_METHOD_LABELS[receipt.method] || receipt.method}
                </span>
              </div>

              {/* Amount Highlight */}
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-between text-emerald-800 dark:text-emerald-300">
                <span className="font-semibold text-sm">AMOUNT PAID:</span>
                <span className="font-mono text-2xl font-bold">
                  {formatCurrency(receipt.amount, { symbol: clinic.currency_symbol })}
                </span>
              </div>

              <div className="grid grid-cols-2 py-2 border-t border-slate-200 dark:border-slate-800 font-medium">
                <span className="text-slate-500">Remaining Balance:</span>
                <span className="font-mono font-bold text-right text-amber-600 dark:text-amber-400">
                  {formatCurrency(receipt.balance_after, { symbol: clinic.currency_symbol })}
                </span>
              </div>
            </div>

            {/* Footer Sign-off */}
            <div className="text-center text-[11px] text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-6 space-y-1">
              <p>Thank you for choosing Happy Tooth Dental Clinic.</p>
              <p>This is a computer-generated receipt. Valid without signature.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
