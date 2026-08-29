// ============================================================
// HAPPY TOOTH v2 — Core Utilities
// ============================================================

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { DEFAULT_CURRENCY } from '@/lib/constants';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================================
// CURRENCY FORMATTING
// ============================================================

export function formatCurrency(
  amount: number | string | null | undefined,
  options?: {
    symbol?: string;
    locale?: string;
    showSymbol?: boolean;
  }
): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : (amount ?? 0);
  const validNum = isNaN(num) ? 0 : num;
  const symbol = options?.symbol ?? DEFAULT_CURRENCY.symbol;
  const locale = options?.locale ?? DEFAULT_CURRENCY.locale;
  const showSymbol = options?.showSymbol ?? true;

  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(validNum);

  return showSymbol ? `${symbol} ${formatted}` : formatted;
}

export function parseCurrency(value: string): number {
  const cleaned = value.replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

// ============================================================
// DATE FORMATTING
// ============================================================

export function formatDate(
  date: string | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return 'Invalid date';

  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  });
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return 'Invalid date';

  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTime(time: string | null | undefined): string {
  if (!time) return '—';
  const parts = time.split(':');
  if (parts.length < 2) return time;
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
}

export function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

// ============================================================
// STRING HELPERS
// ============================================================

export function getFullName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim();
}

export function getInitials(firstName?: string, lastName?: string): string {
  const f = firstName ? firstName.charAt(0) : '';
  const l = lastName ? lastName.charAt(0) : '';
  return (f + l).toUpperCase() || 'HT';
}

export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function roundFinancial(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function generateIdempotencyKey(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : 'idemp_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
}
