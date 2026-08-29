// ============================================================
// Clinic branding & configuration (from clinic_settings)
// ============================================================

export interface ClinicProfile {
  clinic_name: string;
  clinic_tagline: string;
  clinic_phone: string;
  clinic_email: string;
  clinic_address: string;
  clinic_city: string;
  clinic_country: string;
  clinic_website: string;
  clinic_tax_id: string;
  logo_url: string;
  currency_code: string;
  currency_symbol: string;
  receipt_prefix: string;
  invoice_prefix: string;
  patient_prefix: string;
  invoice_footer: string;
  working_hours_start: string;
  working_hours_end: string;
  appointment_duration: string;
}

export const DEFAULT_CLINIC_PROFILE: ClinicProfile = {
  clinic_name: 'Happy Tooth Dental Clinic',
  clinic_tagline: 'Your smile, our priority',
  clinic_phone: '',
  clinic_email: '',
  clinic_address: '',
  clinic_city: 'Lilongwe',
  clinic_country: 'Malawi',
  clinic_website: '',
  clinic_tax_id: '',
  logo_url: '',
  currency_code: 'MWK',
  currency_symbol: 'MK',
  receipt_prefix: 'HT',
  invoice_prefix: 'INV',
  patient_prefix: 'HT-P',
  invoice_footer:
    'Thank you for choosing our clinic. Payments are non-refundable unless otherwise stated.',
  working_hours_start: '08:00',
  working_hours_end: '17:00',
  appointment_duration: '30',
};

export function mapSettingsToProfile(
  settings: Record<string, string> | null | undefined
): ClinicProfile {
  const s = settings || {};
  return {
    clinic_name: s.clinic_name || DEFAULT_CLINIC_PROFILE.clinic_name,
    clinic_tagline: s.clinic_tagline || DEFAULT_CLINIC_PROFILE.clinic_tagline,
    clinic_phone: s.clinic_phone ?? DEFAULT_CLINIC_PROFILE.clinic_phone,
    clinic_email: s.clinic_email ?? DEFAULT_CLINIC_PROFILE.clinic_email,
    clinic_address: s.clinic_address ?? DEFAULT_CLINIC_PROFILE.clinic_address,
    clinic_city: s.clinic_city || DEFAULT_CLINIC_PROFILE.clinic_city,
    clinic_country: s.clinic_country || DEFAULT_CLINIC_PROFILE.clinic_country,
    clinic_website: s.clinic_website ?? DEFAULT_CLINIC_PROFILE.clinic_website,
    clinic_tax_id: s.clinic_tax_id ?? DEFAULT_CLINIC_PROFILE.clinic_tax_id,
    logo_url: s.logo_url ?? DEFAULT_CLINIC_PROFILE.logo_url,
    currency_code: s.currency_code || DEFAULT_CLINIC_PROFILE.currency_code,
    currency_symbol: s.currency_symbol || DEFAULT_CLINIC_PROFILE.currency_symbol,
    receipt_prefix: s.receipt_prefix || DEFAULT_CLINIC_PROFILE.receipt_prefix,
    invoice_prefix: s.invoice_prefix || DEFAULT_CLINIC_PROFILE.invoice_prefix,
    patient_prefix: s.patient_prefix || DEFAULT_CLINIC_PROFILE.patient_prefix,
    invoice_footer: s.invoice_footer || DEFAULT_CLINIC_PROFILE.invoice_footer,
    working_hours_start:
      s.working_hours_start || DEFAULT_CLINIC_PROFILE.working_hours_start,
    working_hours_end:
      s.working_hours_end || DEFAULT_CLINIC_PROFILE.working_hours_end,
    appointment_duration:
      s.appointment_duration || DEFAULT_CLINIC_PROFILE.appointment_duration,
  };
}

export function clinicInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'HT';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
