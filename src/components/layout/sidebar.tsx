'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Stethoscope,
  Receipt,
  TrendingDown,
  BarChart3,
  Settings,
  Activity,
  FileText,
  Banknote,
  FileCheck,
  ClipboardList,
  Syringe,
  Building,
  UserCog,
  Shield,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NAV_ITEMS, type NavItem } from '@/lib/constants';
import type { ClinicProfile } from '@/lib/clinic-profile';
import { clinicInitials, DEFAULT_CLINIC_PROFILE } from '@/lib/clinic-profile';

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard,
  Users,
  Calendar,
  Stethoscope,
  Receipt,
  TrendingDown,
  BarChart3,
  Settings,
  Activity,
  FileText,
  Banknote,
  FileCheck,
  ClipboardList,
  Syringe,
  Building,
  UserCog,
  Shield,
};

interface SidebarProps {
  userPermissions?: string[];
  userRole?: string;
  className?: string;
  onNavigate?: () => void;
  clinic?: ClinicProfile | null;
}

export function Sidebar({ userPermissions = [], userRole = '', className, onNavigate, clinic }: SidebarProps) {
  const brand = clinic || DEFAULT_CLINIC_PROFILE;

  const pathname = usePathname();
  const [openSubmenus, setOpenSubmenus] = React.useState<Record<string, boolean>>({
    Clinical: true,
    Billing: true,
    Settings: true,
  });

  const toggleSubmenu = (title: string) => {
    setOpenSubmenus(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const isVisible = (item: { permission?: string }) => {
    if (!item.permission) return true;
    if (userRole === 'super_admin' || userRole === 'admin') return true;
    return userPermissions.includes(item.permission);
  };

  return (
    <aside
      className={cn(
        'flex flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 w-64 min-h-screen text-slate-800 dark:text-slate-200 select-none',
        className
      )}
    >
      {/* Brand Header — driven by clinic settings */}
      <div className="flex h-16 items-center px-6 border-b border-slate-100 dark:border-slate-800 gap-3">
        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-sky-500 to-cyan-600 text-white shadow-md shadow-sky-500/20">
          {brand.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={brand.logo_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-sm font-bold">{clinicInitials(brand.clinic_name)}</span>
          )}
        </div>
        <div className="min-w-0">
          <h1 className="font-bold text-slate-900 dark:text-white text-sm tracking-tight leading-tight truncate">
            {brand.clinic_name}
          </h1>
          <p className="text-[11px] text-sky-600 dark:text-sky-400 font-medium mt-0.5 truncate">
            {brand.clinic_tagline || 'Dental Practice'}
          </p>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          if (!isVisible(item)) return null;
          const Icon = ICON_MAP[item.iconName] || Activity;
          const isActive = pathname === item.href;
          const hasChildren = item.children && item.children.length > 0;
          const isOpen = openSubmenus[item.title];

          if (hasChildren) {
            const isChildActive = item.children?.some(c => pathname.startsWith(c.href));
            return (
              <div key={item.title} className="space-y-1">
                <button
                  type="button"
                  onClick={() => toggleSubmenu(item.title)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isChildActive
                      ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/50'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </div>
                  <ChevronDown
                    className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')}
                  />
                </button>

                {isOpen && (
                  <div className="pl-9 pr-2 space-y-1">
                    {item.children?.map((child) => {
                      if (!isVisible(child)) return null;
                      const ChildIcon = ICON_MAP[child.iconName] || FileText;
                      const isChildCurrent = pathname === child.href;
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={onNavigate}
                          className={cn(
                            'flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors',
                            isChildCurrent
                              ? 'bg-sky-600 text-white shadow-sm dark:bg-sky-500'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/70'
                          )}
                        >
                          <ChildIcon className="h-3.5 w-3.5" />
                          <span>{child.title}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/20 dark:bg-sky-500'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/50'
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.title}</span>
              {item.badge && (
                <span className="ml-auto rounded-full bg-sky-100 px-2 py-0.5 text-xs text-sky-800 dark:bg-sky-900/40 dark:text-sky-300">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Branding */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400">
        <p className="truncate">{brand.clinic_name}</p>
        <p className="text-[10px] text-slate-400/80 mt-0.5">Production-Ready Core</p>
      </div>
    </aside>
  );
}
