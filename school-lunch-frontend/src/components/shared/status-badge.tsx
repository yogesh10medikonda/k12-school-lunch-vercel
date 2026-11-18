import * as React from 'react';
import { Badge } from '@/components/ui/badge';

export type StatusType =
  | 'Draft'
  | 'Pending'
  | 'Approved'
  | 'Ordered'
  | 'Partially Received'
  | 'Received'
  | 'Cancelled'
  | 'Published'
  | 'Completed'
  | 'In Stock'
  | 'Low Stock'
  | 'Out of Stock'
  | 'Expiring Soon'
  | 'Expired'
  | 'Active'
  | 'Inactive'
  | 'Compliant'
  | 'Non-Compliant'
  | 'Warning'
  | string;

export function StatusBadge({ status }: { status: StatusType }) {
  switch (status) {
    case 'Received':
    case 'Completed':
    case 'In Stock':
    case 'Active':
    case 'Compliant':
      return (
        <Badge variant="success" dot>
          {status}
        </Badge>
      );

    case 'Approved':
    case 'Published':
    case 'Ordered':
      return (
        <Badge variant="primary" dot>
          {status}
        </Badge>
      );

    case 'Pending':
    case 'Low Stock':
    case 'Expiring Soon':
    case 'Partially Received':
    case 'Warning':
      return (
        <Badge variant="warning" dot>
          {status}
        </Badge>
      );

    case 'Cancelled':
    case 'Out of Stock':
    case 'Expired':
    case 'Non-Compliant':
      return (
        <Badge variant="critical" dot>
          {status}
        </Badge>
      );

    case 'Draft':
    case 'Inactive':
    default:
      return (
        <Badge variant="default" dot>
          {status}
        </Badge>
      );
  }
}
