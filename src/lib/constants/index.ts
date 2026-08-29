// ============================================================
// HAPPY TOOTH v2 — Application Constants
// ============================================================

import type {
  UserRole,
  AppointmentStatus,
  InvoiceStatus,
  TreatmentPlanStatus,
  TreatmentItemStatus,
  PaymentMethod,
} from '@/types';

// ============================================================
// ROLE DISPLAY LABELS
// ============================================================

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  dentist: 'Dentist',
  receptionist: 'Receptionist',
  accountant: 'Accountant',
};

export const ADMIN_ROLES: UserRole[] = ['super_admin', 'admin'];
export const CLINICAL_ROLES: UserRole[] = ['super_admin', 'admin', 'dentist'];
export const BILLING_ROLES: UserRole[] = ['super_admin', 'admin', 'accountant', 'receptionist'];

// ============================================================
// APPOINTMENT STATUS
// ============================================================

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  scheduled: 'Scheduled',
  confirmed: 'Confirmed',
  waiting: 'Waiting',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No Show',
};

export const APPOINTMENT_STATUS_COLORS: Record<AppointmentStatus, string> = {
  scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  confirmed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  waiting: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  in_progress: 'bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  completed: 'bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-300 border-green-200 dark:border-green-800',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300 border-red-200 dark:border-red-800',
  no_show: 'bg-slate-100 text-slate-800 dark:bg-slate-800/60 dark:text-slate-300 border-slate-200 dark:border-slate-700',
};

export const APPOINTMENT_STATUS_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  scheduled: ['confirmed', 'cancelled'],
  confirmed: ['waiting', 'cancelled', 'no_show'],
  waiting: ['in_progress', 'cancelled', 'no_show'],
  in_progress: ['completed'],
  completed: [],
  cancelled: [],
  no_show: [],
};

// ============================================================
// INVOICE STATUS
// ============================================================

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  partially_paid: 'Partially Paid',
  paid: 'Paid',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

export const INVOICE_STATUS_COLORS: Record<InvoiceStatus, string> = {
  draft: 'bg-slate-100 text-slate-800 dark:bg-slate-800/60 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  sent: 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  partially_paid: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  paid: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300 border-red-200 dark:border-red-800',
  refunded: 'bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200 dark:border-purple-800',
};

// ============================================================
// TREATMENT PLAN STATUS
// ============================================================

export const TREATMENT_PLAN_STATUS_LABELS: Record<TreatmentPlanStatus, string> = {
  planned: 'Planned',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const TREATMENT_ITEM_STATUS_LABELS: Record<TreatmentItemStatus, string> = {
  planned: 'Planned',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

// ============================================================
// PAYMENT METHODS
// ============================================================

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Cash',
  bank_transfer: 'Bank Transfer',
  mobile_money: 'Mobile Money',
  card: 'Credit/Debit Card',
  other: 'Other',
};

// ============================================================
// PAGINATION & CURRENCY
// ============================================================

export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export const DEFAULT_CURRENCY = {
  code: 'MWK',
  symbol: 'MK',
  locale: 'en-MW',
};

// ============================================================
// NAVIGATION
// ============================================================

export interface NavItem {
  title: string;
  href: string;
  iconName: string;
  permission?: string;
  badge?: string;
  children?: {
    title: string;
    href: string;
    iconName: string;
    permission?: string;
  }[];
}

export const NAV_ITEMS: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/',
    iconName: 'LayoutDashboard',
  },
  {
    title: 'Patients',
    href: '/patients',
    iconName: 'Users',
    permission: 'patients.view',
  },
  {
    title: 'Appointments',
    href: '/appointments',
    iconName: 'Calendar',
    permission: 'appointments.view',
  },
  {
    title: 'Clinical',
    href: '/visits',
    iconName: 'Stethoscope',
    permission: 'visits.view',
    children: [
      { title: 'Visits', href: '/visits', iconName: 'ClipboardList', permission: 'visits.view' },
      { title: 'Procedures', href: '/procedures', iconName: 'Syringe', permission: 'procedures.view' },
      { title: 'Treatment Plans', href: '/treatment-plans', iconName: 'FileText', permission: 'treatment_plans.view' },
    ],
  },
  {
    title: 'Billing',
    href: '/invoices',
    iconName: 'Receipt',
    permission: 'invoices.view',
    children: [
      { title: 'Invoices', href: '/invoices', iconName: 'FileText', permission: 'invoices.view' },
      { title: 'Payments', href: '/payments', iconName: 'Banknote', permission: 'payments.view' },
      { title: 'Receipts', href: '/receipts', iconName: 'FileCheck', permission: 'receipts.view' },
    ],
  },
  {
    title: 'Expenses',
    href: '/expenses',
    iconName: 'TrendingDown',
    permission: 'expenses.view',
  },
  {
    title: 'Reports',
    href: '/reports',
    iconName: 'BarChart3',
    permission: 'reports.financial',
  },
  {
    title: 'Settings',
    href: '/settings',
    iconName: 'Settings',
    children: [
      { title: 'Clinic Profile', href: '/settings/clinic', iconName: 'Building', permission: 'settings.view' },
      { title: 'User Management', href: '/settings/users', iconName: 'UserCog', permission: 'settings.users' },
      { title: 'Audit Trail', href: '/settings/audit', iconName: 'Shield', permission: 'settings.audit' },
    ],
  },
];

export const BLOOD_TYPES = [
  'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-',
] as const;

export const RELATIONSHIP_TYPES = [
  'Spouse',
  'Parent',
  'Child',
  'Sibling',
  'Guardian',
  'Friend',
  'Other',
] as const;
