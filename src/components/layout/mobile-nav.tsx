'use client';

import React from 'react';
import { X } from 'lucide-react';
import { Sidebar } from './sidebar';
import type { ClinicProfile } from '@/lib/clinic-profile';
import { Button } from '@/components/ui/button';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  userPermissions?: string[];
  userRole?: string;
  clinic?: ClinicProfile | null;
}

export function MobileNav({ clinic,  isOpen, onClose, userPermissions, userRole }: MobileNavProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 w-72 bg-white dark:bg-slate-900 shadow-2xl z-50 flex flex-col">
        <div className="absolute top-3 right-3 z-10">
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close Navigation">
            <X className="h-5 w-5" />
          </Button>
        </div>
        <Sidebar
          clinic={clinic}
          userPermissions={userPermissions}
          userRole={userRole}
          onNavigate={onClose}
          className="w-full border-r-0"
        />
      </div>
    </div>
  );
}
