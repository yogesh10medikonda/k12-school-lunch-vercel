'use client';

import * as React from 'react';
import { BarChart3, Download, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/empty-state';
import { useRole } from '@/lib/auth/roles';

export default function ReportsPage() {
  const { hasPermission } = useRole();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Reports & Operational Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Generate student participation, nutrition compliance, food waste, and procurement audits.
          </p>
        </div>

        {hasPermission('export_reports') && (
          <div className="flex items-center gap-2">
            <Button variant="outline" leftIcon={<Printer className="w-4 h-4" />}>
              Print View
            </Button>
            <Button leftIcon={<Download className="w-4 h-4" />}>
              Export Data
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardContent className="p-6">
          <EmptyState
            icon={BarChart3}
            title="Reporting Engine Ready"
            description="Phase 1 routing active. Cross-module aggregation, period comparison, and print/export formatting are scheduled for Phase 10."
          />
        </CardContent>
      </Card>
    </div>
  );
}
