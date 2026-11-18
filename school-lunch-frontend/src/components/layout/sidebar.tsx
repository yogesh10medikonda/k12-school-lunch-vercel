'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Utensils,
  ChevronLeft,
  ChevronRight,
  X,
  ShieldCheck,
} from 'lucide-react';
import { MAIN_NAV_ITEMS } from '@/lib/constants/navigation';
import { useRole } from '@/lib/auth/roles';
import { cn } from '@/lib/utils/cn';

export interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export function Sidebar({
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
}: SidebarProps) {
  const pathname = usePathname();
  const { hasPermission, activeRole } = useRole();

  React.useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname, setIsMobileOpen]);

  const navContent = (
    <div className="flex h-full flex-col justify-between bg-slate-900 text-slate-200">
      <div>
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 transition-opacity hover:opacity-90"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-sm">
              <Utensils className="h-5 w-5" />
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <div className="flex flex-col">
                <span className="font-bold text-sm text-white tracking-tight leading-tight">
                  NutriKitchen OS
                </span>
                <span className="text-[10px] text-emerald-400 font-medium">
                  K-12 School Lunch Suite
                </span>
              </div>
            )}
          </Link>

          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white p-1 rounded-md"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-160px)]">
          {MAIN_NAV_ITEMS.map((item) => {
            const isAuthorized = !item.requiredPermission || hasPermission(item.requiredPermission);
            const isActive =
              pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

            if (!isAuthorized) {
              return (
                <div
                  key={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 text-xs cursor-not-allowed select-none opacity-40',
                    isCollapsed && !isMobileOpen ? 'justify-center' : ''
                  )}
                  title={`Restricted: Requires ${item.requiredPermission}`}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  {(!isCollapsed || isMobileOpen) && (
                    <span className="font-medium line-through">{item.title}</span>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all group select-none',
                  isActive
                    ? 'bg-emerald-800 text-white shadow-xs font-semibold'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white',
                  isCollapsed && !isMobileOpen ? 'justify-center px-2' : ''
                )}
                title={item.title}
              >
                <item.icon
                  className={cn(
                    'w-4 h-4 shrink-0 transition-transform group-hover:scale-110',
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-400'
                  )}
                />
                {(!isCollapsed || isMobileOpen) && (
                  <span className="truncate flex-1">{item.title}</span>
                )}
                {(!isCollapsed || isMobileOpen) && item.badge && (
                  <span
                    className={cn(
                      'ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0',
                      item.badgeVariant === 'warning'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-3 border-t border-slate-800 bg-slate-950/40">
        {(!isCollapsed || isMobileOpen) ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-7 h-7 rounded-lg bg-emerald-950 border border-emerald-700/60 flex items-center justify-center text-emerald-300 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="flex flex-col truncate">
                <span className="text-[11px] font-semibold text-slate-200 truncate">
                  {activeRole}
                </span>
                <span className="text-[10px] text-slate-400 truncate">Lincoln District</span>
              </div>
            </div>

            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsCollapsed(false)}
            className="hidden lg:flex w-full items-center justify-center py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Expand sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      <aside
        className={cn(
          'hidden lg:flex flex-col fixed inset-y-0 left-0 z-30 transition-all duration-200 border-r border-slate-800 shadow-md',
          isCollapsed ? 'w-16' : 'w-64'
        )}
      >
        {navContent}
      </aside>

      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 shadow-2xl transition-transform duration-200 transform',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {navContent}
      </aside>
    </>
  );
}
