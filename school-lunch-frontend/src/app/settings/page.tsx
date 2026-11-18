'use client';

import * as React from 'react';
import { Save, School, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useRole } from '@/lib/auth/roles';

export default function SettingsPage() {
  const { hasPermission } = useRole();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            System Settings & Preferences
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Manage school information, academic year, measurement units, and configurable nutritional guidelines.
          </p>
        </div>

        {hasPermission('manage_settings') && (
          <Button leftIcon={<Save className="w-4 h-4" />}>
            Save Preferences
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <School className="w-4 h-4 text-emerald-800" />
              <CardTitle className="text-base">School & District Profile</CardTitle>
            </div>
            <CardDescription>
              Basic institutional information applied to purchase orders and formal reports.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input label="District Name" defaultValue="Lincoln Unified School District" />
            <Input label="School Name" defaultValue="Lincoln High & Middle Campus" />
            <Input label="Academic Year" defaultValue="2026-2027" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-emerald-800" />
              <CardTitle className="text-base">Jurisdiction & Nutrition Standards</CardTitle>
            </div>
            <CardDescription>
              Configurable nutritional guidelines per age/grade bracket. (No hardcoded statutory limits).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input label="Regulatory Standard" defaultValue="Custom State School Lunch Program (K-12)" />
            <Input label="Default Measurement System" defaultValue="Metric (g, kg, ml, L)" />
            <p className="text-xs text-slate-500 leading-relaxed">
              Full nutritional threshold controls will be editable in the Settings module configuration tab.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
