'use client';

import * as React from 'react';
import { Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/empty-state';
import { useRole } from '@/lib/auth/roles';

export default function FoodWastePage() {
  const { hasPermission } = useRole();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Food Waste & Leftover Tracking
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Record served, leftover, and wasted amounts. Waste % = wasted / prepared x 100.
          </p>
        </div>

        {hasPermission('record_food_waste') && (
          <Button leftIcon={<Plus className="w-4 h-4" />}>
            Log Meal Waste
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-6">
          <EmptyState
            icon={Trash2}
            title="Food Waste Tracking Ready"
            description="Phase 1 routing active. Daily waste logging, prevention analytics, and domain calculation (prepared = served + leftover; wasted <= leftover; zero double-counting) are scheduled for Phase 9."
          />
        </CardContent>
      </Card>
    </div>
  );
}
