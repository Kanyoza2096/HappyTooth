import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, Receipt, PlusCircle, Trash2 } from 'lucide-react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getPatients } from '@/server/services/patient-service';
import { getProcedures } from '@/server/services/clinical-service';
import { createInvoiceAction } from '@/features/billing/actions';
import { getAuthenticatedUser } from '@/server/auth/session';

interface NewInvoicePageProps {
  searchParams: Promise<{ patientId?: string }>;
}

export default async function NewInvoicePage({ searchParams }: NewInvoicePageProps) {
  const user = await getAuthenticatedUser();
  const { patientId = '' } = await searchParams;

  const [patientsResult, procsResult] = await Promise.all([
    getPatients({ pageSize: 100 }),
    getProcedures(),
  ]);

  const patients = patientsResult.data?.data || [];
  const procedures = procsResult.data || [];

  return (
    <DashboardShell user={user}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/invoices">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Create Invoice
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Add dental procedures, quantities, unit prices, and optional discounts.
            </p>
          </div>
        </div>

        <form action={createInvoiceAction} className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400">
                <Receipt className="h-4 w-4" />
                <CardTitle className="text-base">Invoice Header</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Patient <span className="text-red-500">*</span>
                </label>
                <select
                  name="patient_id"
                  required
                  defaultValue={patientId}
                  className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:border-slate-800 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                >
                  <option value="">Select patient...</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.first_name} {p.last_name} ({p.patient_number})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Due Date
                </label>
                <Input type="date" name="due_date" />
              </div>
            </CardContent>
          </Card>

          {/* Line Items Card */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Procedure Line Items</CardTitle>
              <CardDescription className="text-xs">
                Specify descriptions, quantity, and unit price in MK.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Item 1 */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 items-end">
                <div className="sm:col-span-6">
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Procedure / Item Description <span className="text-red-500">*</span>
                  </label>
                  <Input name="item_description" required placeholder="e.g. Adult Dental Prophylaxis (Cleaning)" />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Qty <span className="text-red-500">*</span>
                  </label>
                  <Input type="number" name="item_quantity" min="1" defaultValue="1" required />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Unit Price (MK) <span className="text-red-500">*</span>
                  </label>
                  <Input type="number" step="0.01" name="item_price" min="0" defaultValue="10000" required />
                </div>
              </div>

              {/* Item 2 (Optional) */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 items-end">
                <div className="sm:col-span-6">
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Additional Procedure (Optional)
                  </label>
                  <Input name="item_description" placeholder="e.g. Fluoride Treatment" />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Qty
                  </label>
                  <Input type="number" name="item_quantity" min="1" defaultValue="1" />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Unit Price (MK)
                  </label>
                  <Input type="number" step="0.01" name="item_price" min="0" defaultValue="0" />
                </div>
              </div>

              {/* Item 3 (Optional) */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 items-end">
                <div className="sm:col-span-6">
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Additional Procedure (Optional)
                  </label>
                  <Input name="item_description" placeholder="e.g. Periapical X-Ray" />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Qty
                  </label>
                  <Input type="number" name="item_quantity" min="1" defaultValue="1" />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Unit Price (MK)
                  </label>
                  <Input type="number" step="0.01" name="item_price" min="0" defaultValue="0" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Discount & Notes */}
          <Card className="shadow-sm">
            <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Discount Type
                </label>
                <select
                  name="discount_type"
                  className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:border-slate-800 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                >
                  <option value="">No Discount</option>
                  <option value="fixed">Fixed Amount (MK)</option>
                  <option value="percentage">Percentage (%)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Discount Value
                </label>
                <Input type="number" step="0.01" name="discount_value" defaultValue="0" min="0" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Invoice Notes
                </label>
                <Input name="notes" placeholder="e.g. Payment due within 30 days" />
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-3">
            <Link href="/invoices">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" className="gap-2 shadow-sm">
              <Save className="h-4 w-4" />
              <span>Generate & Issue Invoice</span>
            </Button>
          </div>
        </form>
      </div>
    </DashboardShell>
  );
}
