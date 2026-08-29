import React from 'react';
import Link from 'next/link';
import { FileCheck, ArrowRight, Search } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { getReceipts } from '@/server/services/financial-service';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { PAYMENT_METHOD_LABELS } from '@/lib/constants';
import { getClinicProfile } from '@/server/services/settings-service';

interface ReceiptsPageProps {
  searchParams: Promise<{ page?: string; search?: string }>;
}

export default async function ReceiptsPage({ searchParams }: ReceiptsPageProps) {
  const { page = '1', search = '' } = await searchParams;
  const pageNum = parseInt(page, 10) || 1;
  const clinic = await getClinicProfile();

  const result = await getReceipts({
    page: pageNum,
    pageSize: 20,
    search: search || undefined,
  });

  const receipts = result.data?.data || [];
  const totalPages = result.data?.totalPages || 1;
  const total = result.data?.total || 0;

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Receipts
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Official payment receipts for {clinic.clinic_name}
            </p>
          </div>
        </div>

        <Card className="shadow-sm">
          <CardContent className="p-4">
            <form className="flex gap-2 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  name="search"
                  defaultValue={search}
                  placeholder="Search by receipt # or patient…"
                  className="pl-9"
                />
              </div>
              <Button type="submit" variant="outline" size="sm">
                Search
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt #</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">View</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receipts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-sm text-slate-500">
                      <FileCheck className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                      No receipts yet. Record a payment to generate one.
                    </TableCell>
                  </TableRow>
                ) : (
                  receipts.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs font-semibold">
                        {r.receipt_number}
                      </TableCell>
                      <TableCell className="text-sm">
                        {r.patient
                          ? `${r.patient.first_name} ${r.patient.last_name}`
                          : '—'}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {formatCurrency(r.amount, { symbol: clinic.currency_symbol })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          {PAYMENT_METHOD_LABELS[r.method] || r.method}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {formatDateTime(r.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/receipts/${r.id}`}>
                          <Button variant="ghost" size="sm" className="gap-1">
                            Open <ArrowRight className="h-3 w-3" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-500 dark:border-slate-800">
              <span>
                {total} receipt{total === 1 ? '' : 's'}
              </span>
              <div className="flex gap-2">
                {pageNum > 1 && (
                  <Link href={`/receipts?page=${pageNum - 1}&search=${encodeURIComponent(search)}`}>
                    <Button variant="outline" size="sm">
                      Previous
                    </Button>
                  </Link>
                )}
                {pageNum < totalPages && (
                  <Link href={`/receipts?page=${pageNum + 1}&search=${encodeURIComponent(search)}`}>
                    <Button variant="outline" size="sm">
                      Next
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
