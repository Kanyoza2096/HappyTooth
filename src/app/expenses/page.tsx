import React from 'react';
import Link from 'next/link';
import { TrendingDown, PlusCircle, Calendar, DollarSign, ArrowRight } from 'lucide-react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
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
import { getExpenses, getExpenseCategories } from '@/server/services/financial-service';
import { createExpenseAction } from '@/features/billing/actions';
import { getAuthenticatedUser } from '@/server/auth/session';
import { formatCurrency, formatDate, getTodayISO } from '@/lib/utils';
import { PAYMENT_METHOD_LABELS } from '@/lib/constants';

export default async function ExpensesPage() {
  const user = await getAuthenticatedUser();
  const [expensesResult, catsResult] = await Promise.all([
    getExpenses({ pageSize: 50 }),
    getExpenseCategories(),
  ]);

  const expenses = expensesResult.data?.data || [];
  const categories = catsResult.data || [];
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const today = getTodayISO();

  return (
    <DashboardShell user={user}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Expense Management
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Track clinic operating overhead, consumables, equipment purchases, and facility costs.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Card className="px-4 py-2 border-rose-200 bg-rose-50/60 dark:border-rose-900/50 dark:bg-rose-950/20">
              <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">Total Recorded: </span>
              <span className="text-sm font-bold font-mono text-rose-700 dark:text-rose-300">
                {formatCurrency(totalExpenses)}
              </span>
            </Card>
          </div>
        </div>

        {/* Record New Expense Form Card */}
        <Card className="shadow-sm border-slate-200/90 dark:border-slate-800">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <TrendingDown className="h-4 w-4" />
              <CardTitle className="text-base">Record Operating Expense</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <form action={createExpenseAction} className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  name="category_id"
                  required
                  className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 dark:border-slate-800 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                >
                  <option value="">Select category...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Amount (MK) <span className="text-red-500">*</span>
                </label>
                <Input type="number" step="0.01" name="amount" required placeholder="50000" min="1" />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Date <span className="text-red-500">*</span>
                </label>
                <Input type="date" name="date" required defaultValue={today} />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <Input name="description" required placeholder="e.g. Dental anaesthetic cartridges" />
              </div>

              <div>
                <Button type="submit" className="w-full bg-rose-600 hover:bg-rose-700 text-white gap-1.5 shadow-sm">
                  <PlusCircle className="h-4 w-4" />
                  <span>Record Expense</span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Expenses List */}
        <Card className="shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50/70 dark:bg-slate-900/50">
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Recorded By</TableHead>
                <TableHead className="text-right">Amount (MK)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-40 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2 text-slate-400 text-xs">
                      <DollarSign className="h-6 w-6" />
                      <p>No practice expenses recorded yet</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                expenses.map((exp) => (
                  <TableRow key={exp.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <TableCell className="text-xs text-slate-500">
                      {formatDate(exp.date)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs font-medium">
                        {exp.category?.name || 'General'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-900 dark:text-slate-100 font-medium">
                      {exp.description}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {exp.created_by_profile ? `${exp.created_by_profile.first_name} ${exp.created_by_profile.last_name}` : 'Staff'}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-xs text-rose-600 dark:text-rose-400">
                      {formatCurrency(exp.amount)}
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
