import React from 'react';
import Link from 'next/link';
import { PlusCircle, Search, User, Phone, Calendar, ArrowRight } from 'lucide-react';
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
import { getPatients } from '@/server/services/patient-service';
import { getAuthenticatedUser } from '@/server/auth/session';
import { formatDate } from '@/lib/utils';

interface PatientsPageProps {
  searchParams: Promise<{
    search?: string;
    page?: string;
  }>;
}

export default async function PatientsPage({ searchParams }: PatientsPageProps) {
  const user = await getAuthenticatedUser();
  const { search = '', page = '1' } = await searchParams;
  const pageNum = parseInt(page, 10) || 1;

  const result = await getPatients({
    search: search || undefined,
    page: pageNum,
    pageSize: 20,
  });

  const patients = result.data?.data || [];
  const total = result.data?.total || 0;
  const totalPages = result.data?.totalPages || 1;

  return (
    <DashboardShell user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Patients Directory
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Manage patient demographics, contacts, medical histories, and treatment records.
            </p>
          </div>

          <Link href="/patients/new">
            <Button className="gap-2 shadow-sm">
              <PlusCircle className="h-4 w-4" />
              <span>Register Patient</span>
            </Button>
          </Link>
        </div>

        {/* Search & Filters */}
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <form method="GET" className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  name="search"
                  defaultValue={search}
                  placeholder="Search by name, phone number, or patient ID..."
                  className="pl-9"
                />
              </div>
              <Button type="submit" variant="secondary" size="default">
                Search
              </Button>
              {search && (
                <Link href="/patients">
                  <Button variant="ghost" size="default">
                    Clear
                  </Button>
                </Link>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Patients Table */}
        <Card className="shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50/70 dark:bg-slate-900/50">
              <TableRow>
                <TableHead>Patient ID</TableHead>
                <TableHead>Full Name</TableHead>
                <TableHead>Phone Number</TableHead>
                <TableHead>Date of Birth</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                        <User className="h-5 w-5" />
                      </div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {search ? 'No matching patients found' : 'No patients registered yet'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {search ? 'Try adjusting your search criteria' : 'Get started by creating your first patient profile'}
                      </p>
                      {!search && (
                        <Link href="/patients/new" className="pt-2">
                          <Button size="sm" variant="outline">
                            Register First Patient
                          </Button>
                        </Link>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                patients.map((patient) => (
                  <TableRow key={patient.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <TableCell className="font-mono text-xs font-semibold text-sky-600 dark:text-sky-400">
                      {patient.patient_number}
                    </TableCell>
                    <TableCell className="font-medium text-slate-900 dark:text-slate-100">
                      {patient.first_name} {patient.last_name}
                    </TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-400 text-xs">
                      {patient.phone || '—'}
                    </TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-400 text-xs">
                      {formatDate(patient.date_of_birth)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={patient.is_active ? 'success' : 'secondary'}>
                        {patient.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/patients/${patient.id}`}>
                        <Button variant="ghost" size="sm" className="gap-1 text-xs text-sky-600 dark:text-sky-400">
                          <span>View Profile</span>
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
              <div>
                Showing page {pageNum} of {totalPages} ({total} total records)
              </div>
              <div className="flex items-center gap-2">
                {pageNum > 1 && (
                  <Link href={`/patients?page=${pageNum - 1}${search ? `&search=${search}` : ''}`}>
                    <Button variant="outline" size="sm">Previous</Button>
                  </Link>
                )}
                {pageNum < totalPages && (
                  <Link href={`/patients?page=${pageNum + 1}${search ? `&search=${search}` : ''}`}>
                    <Button variant="outline" size="sm">Next</Button>
                  </Link>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>
    </DashboardShell>
  );
}
