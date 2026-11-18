'use client';

import * as React from 'react';
import { Receipt, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/empty-state';
import { useRole } from '@/lib/auth/roles';

export default function PurchaseOrdersPage() {
  const { hasPermission } = useRole();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Purchase Orders & Receiving
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Shortage-driven procurement, approval workflows, and delivery check-in.
          </p>
        </div>

        {hasPermission('create_purchase_order') && (
          <Button leftIcon={<Plus className="w-4 h-4" />}>
            Create Purchase Order
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-6">
          <EmptyState
            icon={Receipt}
            title="Purchase Order Module Ready"
            description="Phase 1 routing active. PO lifecycle (Draft -> Pending -> Approved -> Ordered -> Partially Received -> Received -> Cancelled) and inventory reconciliation are scheduled for Phase 8."
          />
        </CardContent>
      </Card>
    </div>
  );
}
