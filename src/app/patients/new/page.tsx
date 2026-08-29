import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, User, Phone, ShieldAlert, HeartPulse } from 'lucide-react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { registerPatientFormAction } from '@/features/patients/actions';
import { getAuthenticatedUser } from '@/server/auth/session';
import { BLOOD_TYPES, RELATIONSHIP_TYPES } from '@/lib/constants';

export default async function NewPatientPage() {
  const user = await getAuthenticatedUser();

  return (
    <DashboardShell user={user}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/patients">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                Register New Patient
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Complete patient demographic, contact, and initial medical information.
              </p>
            </div>
          </div>
        </div>

        <form action={registerPatientFormAction} className="space-y-6">
          {/* Section 1: Demographics */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400">
                <User className="h-4 w-4" />
                <CardTitle className="text-base">Demographics & Identity</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Essential identification details for the patient record.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <Input name="first_name" required placeholder="e.g. John" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <Input name="last_name" required placeholder="e.g. Banda" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Date of Birth
                </label>
                <Input type="date" name="date_of_birth" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Gender
                </label>
                <select
                  name="gender"
                  className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:border-slate-800 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                >
                  <option value="">Select gender...</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  National ID / Passport No.
                </label>
                <Input name="national_id" placeholder="e.g. MW123456" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Occupation
                </label>
                <Input name="occupation" placeholder="e.g. Accountant" />
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Contact Information */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400">
                <Phone className="h-4 w-4" />
                <CardTitle className="text-base">Contact Information</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Primary phone, email, and residential address.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Primary Phone Number <span className="text-red-500">*</span>
                </label>
                <Input name="phone" required placeholder="e.g. +265 999 123 456" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Alternative Phone
                </label>
                <Input name="alt_phone" placeholder="e.g. +265 888 123 456" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <Input type="email" name="email" placeholder="e.g. john.banda@example.com" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  City / Town
                </label>
                <Input name="city" placeholder="e.g. Lilongwe" />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Physical Residential Address
                </label>
                <Input name="address" placeholder="e.g. Area 47, Sector 3, Plot 12" />
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Emergency Contact */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400">
                <ShieldAlert className="h-4 w-4" />
                <CardTitle className="text-base">Emergency Contact</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Next of kin or emergency point of contact.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Contact Full Name
                </label>
                <Input name="contact_name" placeholder="e.g. Mary Banda" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Relationship
                </label>
                <select
                  name="contact_relationship"
                  className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:border-slate-800 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                >
                  <option value="">Select relationship...</option>
                  {RELATIONSHIP_TYPES.map((rel) => (
                    <option key={rel} value={rel}>{rel}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Contact Phone
                </label>
                <Input name="contact_phone" placeholder="e.g. +265 999 654 321" />
              </div>
            </CardContent>
          </Card>

          {/* Section 4: Initial Medical Profile */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400">
                <HeartPulse className="h-4 w-4" />
                <CardTitle className="text-base">Initial Medical Notes & Allergies</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Essential clinical alerts for safe dental procedures.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Blood Group
                </label>
                <select
                  name="blood_type"
                  className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:border-slate-800 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                >
                  <option value="">Unknown / Not Tested</option>
                  {BLOOD_TYPES.map((bt) => (
                    <option key={bt} value={bt}>{bt}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Known Allergies (comma-separated)
                </label>
                <Input name="allergies" placeholder="e.g. Penicillin, Latex" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Chronic Conditions (comma-separated)
                </label>
                <Input name="chronic_conditions" placeholder="e.g. Hypertension, Diabetes" />
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Link href="/patients">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" className="gap-2 shadow-sm">
              <Save className="h-4 w-4" />
              <span>Save & Create Patient Record</span>
            </Button>
          </div>
        </form>
      </div>
    </DashboardShell>
  );
}
