'use client';

import * as React from 'react';
import { Sidebar } from './sidebar';
import { TopBar } from './top-bar';
import { DemoDataBanner } from '@/mocks/demo-badge';
import { cn } from '@/lib/utils/cn';

export interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 font-sans antialiased selection:bg-emerald-100 selection:text-emerald-900">
      <DemoDataBanner />

      <div className="flex">
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
          isMobileOpen={isMobileMenuOpen}
          setIsMobileOpen={setIsMobileMenuOpen}
        />

        <div
          className={cn(
            'flex flex-col flex-1 min-w-0 transition-all duration-200',
            isSidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'
          )}
        >
          <TopBar
            onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
            isSidebarCollapsed={isSidebarCollapsed}
          />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
