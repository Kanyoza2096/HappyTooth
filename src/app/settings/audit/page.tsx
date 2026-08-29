import React from 'react';
import { Shield, Clock, User } from 'lucide-react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { getAuditLogs } from '@/server/services/settings-service';
import { getAuthenticatedUser } from '@/server/auth/session';
import { formatDateTime } from '@/lib/utils';

export default async function AuditLogPage() {
  const user = await getAuthenticatedUser();
  const result = await getAuditLogs({ pageSize: 50 });
  const logs = result.data?.data || [];

  return (
    <DashboardShell user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Immutable Audit Trail
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Complete security and compliance log of sensitive medical, patient, and billing mutations.
          </p>
        </div>

        <Card className="shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50/70 dark:bg-slate-900/50">
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity Type</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Metadata Summary</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-40 text-center text-xs text-slate-400">
                    No audit records logged yet. All mutations automatically write tamper-evident logs here.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <TableCell className="font-mono text-xs text-slate-500 whitespace-nowrap">
                      {formatDateTime(log.created_at)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-[11px] text-sky-600 dark:text-sky-400">
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-xs text-slate-900 dark:text-slate-100 capitalize">
                      {log.entity_type}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 dark:text-slate-400">
                      {log.actor ? `${log.actor.first_name} ${log.actor.last_name}` : 'System / Service Role'}
                    </TableCell>
                    <TableCell className="font-mono text-[11px] text-slate-400 max-w-xs truncate">
                      {log.metadata ? JSON.stringify(log.metadata) : '—'}
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
