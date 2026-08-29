import React from 'react';
import { Syringe, PlusCircle, Folder } from 'lucide-react';
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
import { getProcedures, getProcedureCategories } from '@/server/services/clinical-service';
import { getAuthenticatedUser } from '@/server/auth/session';
import { formatCurrency } from '@/lib/utils';

export default async function ProceduresPage() {
  const user = await getAuthenticatedUser();
  const [procsResult, catsResult] = await Promise.all([
    getProcedures(),
    getProcedureCategories(),
  ]);

  const procedures = procsResult.data || [];
  const categories = catsResult.data || [];

  return (
    <DashboardShell user={user}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Procedures & Pricing Catalog
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Standard dental service codes, category classifications, and practice pricing (MK).
            </p>
          </div>
        </div>

        {/* Categories Pills */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <span
                key={cat.id}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 shadow-sm"
              >
                <Folder className="h-3 w-3 text-sky-500" />
                <span>{cat.name}</span>
              </span>
            ))}
          </div>
        )}

        <Card className="shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50/70 dark:bg-slate-900/50">
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Procedure Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Standard Fee (MK)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {procedures.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-40 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2 text-slate-400 text-xs">
                      <Syringe className="h-6 w-6" />
                      <p>Run Supabase migration to seed the default dental procedure catalog.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                procedures.map((proc) => (
                  <TableRow key={proc.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <TableCell className="font-mono text-xs font-semibold text-sky-600 dark:text-sky-400">
                      {proc.code || '—'}
                    </TableCell>
                    <TableCell className="font-medium text-slate-900 dark:text-slate-100 text-xs">
                      {proc.name}
                    </TableCell>
                    <TableCell className="text-slate-500 text-xs max-w-md truncate">
                      {proc.description || 'Standard practice procedure'}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-slate-900 dark:text-slate-100 text-xs">
                      {formatCurrency(proc.default_price)}
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
