'use client';

import * as React from 'react';
import {
  Users,
  UtensilsCrossed,
  PackageOpen,
  AlertTriangle,
  Receipt,
  Apple,
  Trash2,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { SummaryCard } from '@/components/shared/summary-card';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRole } from '@/lib/auth/roles';

export default function DashboardPage() {
  const { currentUser, activeRole } = useRole();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 p-6 text-white shadow-md">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Operations Center
            </span>
            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
              Live School Day
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Welcome back, {currentUser.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            {currentUser.schoolName} &mdash; Active preview role:{' '}
            <span className="font-semibold text-emerald-300">{activeRole}</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-xs font-medium backdrop-blur-sm">
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              Today:{' '}
              {new Date().toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <SummaryCard
          title="Total Students"
          value="1,420"
          subtitle="Enrolled"
          icon={Users}
          href="/students"
          variant="navy"
          trend={{ value: '+12 this term', direction: 'up' }}
        />
        <SummaryCard
          title="Meals Planned"
          value="850"
          subtitle="Lunch + Bfast"
          icon={UtensilsCrossed}
          href="/menus"
          variant="default"
          trend={{ value: '200 Hot Lunch', direction: 'neutral' }}
        />
        <SummaryCard
          title="Available Stock"
          value="142"
          subtitle="Ingredients"
          icon={PackageOpen}
          href="/inventory"
          variant="success"
        />
        <SummaryCard
          title="Low Stock"
          value="3"
          subtitle="Need reorder"
          icon={AlertTriangle}
          href="/inventory"
          variant="warning"
        />
        <SummaryCard
          title="Pending POs"
          value="2"
          subtitle="Awaiting Delivery"
          icon={Receipt}
          href="/purchase-orders"
          variant="default"
        />
        <SummaryCard
          title="Nutrition"
          value="98.2%"
          subtitle="USDA / State Compliant"
          icon={Apple}
          href="/nutrition"
          variant="success"
          trend={{ value: 'Optimal', direction: 'up' }}
        />
        <SummaryCard
          title="Waste Rate"
          value="4.8%"
          subtitle="Prepared vs Wasted"
          icon={Trash2}
          href="/food-waste"
          variant="warning"
          trend={{ value: '-1.2% this wk', direction: 'down' }}
        />
      </div>

      <Card className="border-emerald-200/60 bg-emerald-50/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-700" />
              <CardTitle className="text-base text-emerald-950">
                Phase 1 Shell &amp; Foundation Ready
              </CardTitle>
            </div>
            <Badge variant="success">Phase 1 Complete</Badge>
          </div>
          <CardDescription className="text-emerald-900/80">
            The core architecture, design system, API client, role permissions switcher, central
            unit conversions, and shared components are active.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-xs text-emerald-950/90 space-y-2">
          <p>
            You can test the collapsible sidebar, top navigation, search, notifications popover, and
            the active role switcher in the header to preview permissions across Administrator,
            Nutritionist, Inventory Manager, and Kitchen Staff.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
