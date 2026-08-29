'use client';

import React, { useSyncExternalStore } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, LogOut, Menu, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ROLE_LABELS } from '@/lib/constants';
import { getInitials } from '@/lib/utils';
import type { AuthenticatedUser } from '@/types';
import type { ClinicProfile } from '@/lib/clinic-profile';
import { DEFAULT_CLINIC_PROFILE } from '@/lib/clinic-profile';

interface HeaderProps {
  user?: AuthenticatedUser | null;
  onOpenMobileNav?: () => void;
  onLogout?: () => Promise<void>;
}

const emptySubscribe = () => () => {};

export function Header({ user, onOpenMobileNav, onLogout }: HeaderProps) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const isDark = (theme === 'system' ? resolvedTheme : theme) === 'dark';

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/80 px-4 sm:px-6 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onOpenMobileNav}
          aria-label="Open Navigation"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200 hidden sm:block truncate max-w-[240px]">
            {brand.clinic_name}
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        {mounted ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-full text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle Theme"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? (
              <Sun className="h-4 w-4 text-amber-400 animate-in fade-in" />
            ) : (
              <Moon className="h-4 w-4 text-slate-600 dark:text-slate-400 animate-in fade-in" />
            )}
          </Button>
        ) : (
          <div className="h-9 w-9" />
        )}

        {/* User Info & Avatar */}
        {user ? (
          <div className="flex items-center gap-3 pl-2 border-l border-slate-200 dark:border-slate-800">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-sky-600 to-cyan-500 text-white font-semibold text-xs shadow-sm">
              {getInitials(user.first_name, user.last_name)}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-none">
                {user.first_name} {user.last_name}
              </p>
              <p className="text-[11px] text-sky-600 dark:text-sky-400 font-medium mt-0.5">
                {ROLE_LABELS[user.role] || user.role}
              </p>
            </div>
            {onLogout && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onLogout}
                className="text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <User className="h-4 w-4 text-slate-500" />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
