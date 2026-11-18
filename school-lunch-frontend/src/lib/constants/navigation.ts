import {
  LayoutDashboard,
  Users,
  UtensilsCrossed,
  Apple,
  PackageOpen,
  Building2,
  Receipt,
  Trash2,
  BarChart3,
  Settings,
  LucideIcon,
} from 'lucide-react';
import { Permission } from '../auth/roles';

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  badgeVariant?: 'default' | 'warning' | 'critical' | 'success';
  requiredPermission?: Permission;
  description: string;
}

export const MAIN_NAV_ITEMS: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    requiredPermission: 'view_dashboard',
    description: 'Central overview of lunch operations, meals, and alerts',
  },
  {
    title: 'Students',
    href: '/students',
    icon: Users,
    requiredPermission: 'view_students',
    description: 'Student directory, allergies, and dietary safeguards',
  },
  {
    title: 'Menu Management',
    href: '/menus',
    icon: UtensilsCrossed,
    requiredPermission: 'view_menus',
    description: 'Meal scheduling, recipes, and ingredient requirements',
  },
  {
    title: 'Nutrition',
    href: '/nutrition',
    icon: Apple,
    requiredPermission: 'view_nutrition',
    description: 'Nutritional analysis and guideline compliance engine',
  },
  {
    title: 'Inventory',
    href: '/inventory',
    icon: PackageOpen,
    requiredPermission: 'view_inventory',
    badge: '3 Low',
    badgeVariant: 'warning',
    description: 'Stock tracking, non-negative checks, and expiry alerts',
  },
  {
    title: 'Vendors',
    href: '/vendors',
    icon: Building2,
    requiredPermission: 'view_vendors',
    description: 'Supplier directory, catalog pricing, and comparisons',
  },
  {
    title: 'Purchase Orders',
    href: '/purchase-orders',
    icon: Receipt,
    requiredPermission: 'view_purchase_orders',
    badge: '2 Pending',
    badgeVariant: 'default',
    description: 'Shortage procurement, order lifecycle, and receiving',
  },
  {
    title: 'Food Waste',
    href: '/food-waste',
    icon: Trash2,
    requiredPermission: 'view_food_waste',
    description: 'Leftover vs discarded tracking and waste analytics',
  },
  {
    title: 'Reports & Analytics',
    href: '/reports',
    icon: BarChart3,
    requiredPermission: 'view_reports',
    description: 'Nutritional, financial, and operational reports',
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
    requiredPermission: 'manage_settings',
    description: 'School profile, academic years, and custom guidelines',
  },
];
