'use client';

import React, { useActionState } from 'react';
import { Building, Save, Image as ImageIcon, Clock, Coins, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  saveClinicSettingsAction,
  type ClinicSettingsFormState,
} from '@/features/settings/actions';
import type { ClinicProfile } from '@/lib/clinic-profile';
import { clinicInitials } from '@/lib/clinic-profile';

const initialState: ClinicSettingsFormState = { success: false };

export function ClinicSettingsForm({ profile }: { profile: ClinicProfile }) {
  const [state, formAction, isPending] = useActionState(
    saveClinicSettingsAction,
    initialState
  );

  return (
    <form action={formAction} className="space-y-6">
      {state.success && (
        <div
          role="status"
          className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Clinic settings saved. Branding will update across the app.</span>
        </div>
      )}
      {state.error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      {/* Identity */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400">
            <Building className="h-4 w-4" />
            <CardTitle className="text-base">Practice identity</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Shown in the sidebar, header, login screen, invoices, and receipts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Practice name <span className="text-red-500">*</span>
              </label>
              <Input name="clinic_name" required defaultValue={profile.clinic_name} />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Tagline
              </label>
              <Input name="clinic_tagline" defaultValue={profile.clinic_tagline} placeholder="Your smile, our priority" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Primary phone
              </label>
              <Input name="clinic_phone" defaultValue={profile.clinic_phone} placeholder="+265 …" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Contact email
              </label>
              <Input name="clinic_email" type="email" defaultValue={profile.clinic_email} />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Street address
              </label>
              <Input name="clinic_address" defaultValue={profile.clinic_address} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                City
              </label>
              <Input name="clinic_city" defaultValue={profile.clinic_city} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Country
              </label>
              <Input name="clinic_country" defaultValue={profile.clinic_country} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Website
              </label>
              <Input name="clinic_website" defaultValue={profile.clinic_website} placeholder="https://" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Tax / registration ID
              </label>
              <Input name="clinic_tax_id" defaultValue={profile.clinic_tax_id} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logo */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400">
            <ImageIcon className="h-4 w-4" />
            <CardTitle className="text-base">Logo & brand mark</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Paste a public image URL (HTTPS). Leave blank to use the letter mark.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
              {profile.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.logo_url} alt="Logo preview" className="h-full w-full object-contain" />
              ) : (
                <span className="text-lg font-bold text-sky-600">
                  {clinicInitials(profile.clinic_name)}
                </span>
              )}
            </div>
            <div className="flex-1 w-full">
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Logo image URL
              </label>
              <Input
                name="logo_url"
                defaultValue={profile.logo_url}
                placeholder="https://cdn.example.com/logo.png"
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Host the image on Supabase Storage, Cloudinary, or any public CDN.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Currency & document prefixes */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400">
            <Coins className="h-4 w-4" />
            <CardTitle className="text-base">Currency & document numbers</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Currency code
              </label>
              <Input name="currency_code" defaultValue={profile.currency_code} placeholder="MWK" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Currency symbol
              </label>
              <Input name="currency_symbol" defaultValue={profile.currency_symbol} placeholder="MK" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Receipt prefix
              </label>
              <Input name="receipt_prefix" defaultValue={profile.receipt_prefix} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Invoice prefix
              </label>
              <Input name="invoice_prefix" defaultValue={profile.invoice_prefix} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Patient number prefix
              </label>
              <Input name="patient_prefix" defaultValue={profile.patient_prefix} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hours */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400">
            <Clock className="h-4 w-4" />
            <CardTitle className="text-base">Working hours</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Opens
              </label>
              <Input name="working_hours_start" type="time" defaultValue={profile.working_hours_start} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Closes
              </label>
              <Input name="working_hours_end" type="time" defaultValue={profile.working_hours_end} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Default appointment (minutes)
              </label>
              <Input
                name="appointment_duration"
                type="number"
                min={5}
                step={5}
                defaultValue={profile.appointment_duration}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer text */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400">
            <FileText className="h-4 w-4" />
            <CardTitle className="text-base">Invoice & receipt footer</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Textarea
            name="invoice_footer"
            rows={3}
            defaultValue={profile.invoice_footer}
            placeholder="Thank you for choosing our clinic…"
          />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending} className="gap-2 shadow-sm">
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save clinic settings
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
