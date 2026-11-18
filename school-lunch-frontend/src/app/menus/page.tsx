'use client';

import * as React from 'react';
import { UtensilsCrossed, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/empty-state';
import { useRole } from '@/lib/auth/roles';

export default function MenusPage() {
  const { hasPermission } = useRole();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Menu Management & Meal Planning
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Create, schedule, and publish daily/weekly menus with ingredient requirement scaling.
          </p>
        </div>

        {hasPermission('manage_menus') && (
          <Button leftIcon={<Plus className="w-4 h-4" />}>
            Create Meal Plan
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-6">
          <EmptyState
            icon={UtensilsCrossed}
            title="Menu Planning Workspace Ready"
            description="Phase 1 routing active. Calendar view, recipe ingredient multiplier (quantity per serving x servings), and Draft -> Published lifecycle are scheduled for Phase 4."
          />
        </CardContent>
      </Card>
    </div>
  );
}
