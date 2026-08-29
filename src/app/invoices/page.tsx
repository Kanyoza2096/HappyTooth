import React from 'react';
import Link from 'next/link';
import { Receipt, PlusCircle, ArrowRight, CreditCard } from 'lucide-react';
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
import { getInvoices } from '@/server/services/financial-service';
import { getAuthenticatedUser } from '@/server/auth/session';
import { formatCurrency, formatDate } from '@/lib/utils';
import { INVOICE_STATUS_LABELS, INVOICE_STATUS_COLORS } from '@/lib/constants';
import type { InvoiceStatus } from '@/types';

interface InvoicesPageProps {
  searchParams: Promise<{ status?: string; page?: string }>;
}

export default async function InvoicesPage({ searchParams }: InvoicesPageProps) {
  const user = await getAuthenticatedUser();
  const { status = '', page = '1' } = await searchParams;
  const pageNum = parseInt(page, 10) || 1;

  const result = await getInvoices({
    status: status ? (status as InvoiceStatus) : undefined,
    page: pageNum,
    pageSize: 25,
  });

  const invoices = result.data?.data || [];
  const total = result.data?.total || 0;
  const totalPages = result.data?.totalPages || 1;

  return (
    <DashboardShell user={user}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Invoices & Receivables
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Issue dental invoices, collect payments, and manage outstanding balances.
            </p>
          </div>

          <Link href="/invoices/new">
            <Button className="gap-2 shadow-sm">
              <PlusCircle className="h-4 w-4" />
              <span>Create Invoice</span>
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <form method="GET" className="flex flex-wrap items-center gap-3">
              <select
                name="status"
                defaultValue={status}
                className="h-9 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="">All Invoice Statuses</option>
                <option value="sent">Sent / Unpaid</option>
                <option value="partially_paid">Partially Paid</option>
                <option value="paid">Fully Paid</option>
                <option value="draft">Draft</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <Button type="submit" variant="secondary" size="sm">
                Filter Invoices
              </Button>

              {status && (
                <Link href="/invoices">
                  <Button variant="ghost" size="sm">
                    Clear
                  </Button>
                </Link>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Invoices Table */}
        <Card className="shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50/70 dark:bg-slate-900/50">
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
                <TableHead className="text-right">Total Due</TableHead>
                <TableHead className="text-right">Amount Paid</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2 text-slate-400 text-xs">
                      <Receipt className="h-8 w-8" />
                      <p className="font-medium text-slate-900 dark:text-slate-100 text-sm">
                        No invoices found
                      </p>
                      <p>Generate an invoice for dental procedures rendered.</p>
                      <Link href="/invoices/new" className="pt-2">
                        <Button size="sm" variant="outline">
                          Create First Invoice
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((inv) => (
                  <TableRow key={inv.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <TableCell className="font-mono text-xs font-semibold text-sky-600 dark:text-sky-400">
                      {inv.invoice_number}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {formatDate(inv.created_at)}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/patients/${inv.patient_id}`}
                        className="font-medium text-slate-900 dark:text-slate-100 hover:underline text-xs"
                      >
                        {inv.patient?.first_name} {inv.patient?.last_name}
                      </Link>
                      <p className="text-[11px] text-slate-400 font-mono">
                        {inv.patient?.patient_number}
                      </p>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-slate-500">
                      {formatCurrency(inv.subtotal)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-xs text-slate-900 dark:text-slate-100">
                      {formatCurrency(inv.total)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(inv.amount_paid)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-xs text-amber-600 dark:text-amber-400">
                      {formatCurrency(inv.outstanding_balance)}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${INVOICE_STATUS_COLORS[inv.status]}`}>
                        {INVOICE_STATUS_LABELS[inv.status]}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <a href={`/api/invoices/${inv.id}/pdf`} download>
                          <Button variant="outline" size="sm" className="text-xs">
                            PDF
                          </Button>
                        </a>
                        <Link href={`/invoices/${inv.id}`}>
                          <Button variant="ghost" size="sm" className="gap-1 text-xs text-sky-600 dark:text-sky-400">
                            <span>View</span>
                            <ArrowRight className="h-3 w-3" />
                          </Button>
                        </Link>
                      </div>
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
