'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole =
  | 'Administrator'
  | 'Nutritionist'
  | 'Kitchen Staff'
  | 'Inventory Manager';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  schoolName: string;
  avatarUrl?: string;
}

export type Permission =
  | 'view_dashboard'
  | 'manage_students'
  | 'view_students'
  | 'manage_menus'
  | 'publish_menus'
  | 'view_menus'
  | 'manage_nutrition'
  | 'configure_guidelines'
  | 'view_nutrition'
  | 'manage_inventory'
  | 'record_stock_movement'
  | 'view_inventory'
  | 'manage_vendors'
  | 'view_vendors'
  | 'create_purchase_order'
  | 'approve_purchase_order'
  | 'receive_purchase_order'
  | 'view_purchase_orders'
  | 'record_food_waste'
  | 'view_food_waste'
  | 'view_reports'
  | 'export_reports'
  | 'manage_settings';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  Administrator: [
    'view_dashboard',
    'manage_students',
    'view_students',
    'manage_menus',
    'publish_menus',
    'view_menus',
    'manage_nutrition',
    'configure_guidelines',
    'view_nutrition',
    'manage_inventory',
    'record_stock_movement',
    'view_inventory',
    'manage_vendors',
    'view_vendors',
    'create_purchase_order',
    'approve_purchase_order',
    'receive_purchase_order',
    'view_purchase_orders',
    'record_food_waste',
    'view_food_waste',
    'view_reports',
    'export_reports',
    'manage_settings',
  ],
  Nutritionist: [
    'view_dashboard',
    'view_students',
    'manage_menus',
    'publish_menus',
    'view_menus',
    'manage_nutrition',
    'configure_guidelines',
    'view_nutrition',
    'view_inventory',
    'view_reports',
    'export_reports',
  ],
  'Inventory Manager': [
    'view_dashboard',
    'view_menus',
    'manage_inventory',
    'record_stock_movement',
    'view_inventory',
    'manage_vendors',
    'view_vendors',
    'create_purchase_order',
    'approve_purchase_order',
    'receive_purchase_order',
    'view_purchase_orders',
    'view_food_waste',
    'view_reports',
    'export_reports',
  ],
  'Kitchen Staff': [
    'view_dashboard',
    'view_students',
    'view_menus',
    'view_inventory',
    'record_stock_movement',
    'receive_purchase_order',
    'record_food_waste',
    'view_food_waste',
  ],
};

export const MOCK_USERS: Record<UserRole, UserProfile> = {
  Administrator: {
    id: 'usr_admin_01',
    name: 'Eleanor Vance',
    email: 'e.vance@lincolndistrict.edu',
    role: 'Administrator',
    schoolName: 'Lincoln Unified School District',
  },
  Nutritionist: {
    id: 'usr_nutr_02',
    name: 'Dr. Marcus Chen, RD',
    email: 'm.chen@lincolndistrict.edu',
    role: 'Nutritionist',
    schoolName: 'Lincoln Unified School District',
  },
  'Inventory Manager': {
    id: 'usr_inv_03',
    name: 'Sarah Jenkins',
    email: 's.jenkins@lincolndistrict.edu',
    role: 'Inventory Manager',
    schoolName: 'Lincoln Central Commissary',
  },
  'Kitchen Staff': {
    id: 'usr_kitch_04',
    name: 'Chef Mateo Rodriguez',
    email: 'm.rodriguez@lincolnhigh.edu',
    role: 'Kitchen Staff',
    schoolName: 'Lincoln High School Kitchen',
  },
};

interface RoleContextType {
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  currentUser: UserProfile;
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [activeRole, setActiveRoleState] = useState<UserRole>('Administrator');

  useEffect(() => {
    const saved = localStorage.getItem('k12_active_role') as UserRole | null;
    if (saved && Object.keys(ROLE_PERMISSIONS).includes(saved)) {
      setActiveRoleState(saved);
    }
  }, []);

  const setActiveRole = (role: UserRole) => {
    setActiveRoleState(role);
    localStorage.setItem('k12_active_role', role);
  };

  const currentUser = MOCK_USERS[activeRole];

  const hasPermission = (permission: Permission): boolean => {
    return ROLE_PERMISSIONS[activeRole].includes(permission);
  };

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    return permissions.some((p) => hasPermission(p));
  };

  return (
    <RoleContext.Provider
      value={{
        activeRole,
        setActiveRole,
        currentUser,
        hasPermission,
        hasAnyPermission,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole(): RoleContextType {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}
