import React from 'react';
import Link from 'next/link';
import { Banknote, ArrowRight } from 'lucide-react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { getPayments } from '@/server/services/financial-service';
import { getAuthenticatedUser } from '@/server/auth/session';
import { formatCurrency, formatDate } from '@/lib/utils';
import { PAYMENT_METHOD_LABELS } from '@/lib/constants';

export default async function PaymentsPage() {
  const user = await getAuthenticatedUser();
  const result = await getPayments({ pageSize: 50 });
  const payments = result.data?.data || [];

  return (
    <DashboardShell user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Payment Transactions Log
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Audit-backed log of all collected payments, transaction references, and payment methods.
          </p>
        </div>

        <Card className="shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50/70 dark:bg-slate-900/50">
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Invoice #</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead className="text-right">Amount (MK)</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-40 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2 text-slate-400 text-xs">
                      <Banknote className="h-6 w-6" />
                      <p>No payments recorded yet</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((p) => (
                  <TableRow key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <TableCell className="text-xs text-slate-500">
                      {formatDate(p.created_at)}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/patients/${p.patient_id}`}
                        className="font-medium text-slate-900 dark:text-slate-100 hover:underline text-xs"
                      >
                        {p.patient?.first_name} {p.patient?.last_name}
                      </Link>
                      <p className="text-[11px] text-slate-400 font-mono">
                        {p.patient?.patient_number}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/invoices/${p.invoice_id}`}
                        className="font-mono text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline"
                      >
                        {p.invoice?.invoice_number}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs capitalize">
                        {PAYMENT_METHOD_LABELS[p.method] || p.method}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-500">
                      {p.reference || '—'}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(p.amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/invoices/${p.invoice_id}`}>
                        <Button variant="ghost" size="sm" className="gap-1 text-xs text-sky-600 dark:text-sky-400">
                          <span>Invoice</span>
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </DashboardShell>
  );
}
