'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Menu,
  Search,
  Bell,
  Shield,
  ChevronDown,
  Check,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { useRole, UserRole } from '@/lib/auth/roles';
import { DemoDataPill } from '@/mocks/demo-badge';
import { cn } from '@/lib/utils/cn';

export interface TopBarProps {
  onOpenMobileMenu: () => void;
  isSidebarCollapsed: boolean;
}

export function TopBar({ onOpenMobileMenu }: TopBarProps) {
  const router = useRouter();
  const { activeRole, setActiveRole, currentUser } = useRole();

  const [searchVal, setSearchVal] = React.useState('');
  const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = React.useState(false);
  const [isRoleMenuOpen, setIsRoleMenuOpen] = React.useState(false);

  React.useEffect(() => {
    const handleWindowClick = () => {
      setIsNotificationsOpen(false);
      setIsProfileMenuOpen(false);
      setIsRoleMenuOpen(false);
    };
    window.addEventListener('click', handleWindowClick);
    return () => window.removeEventListener('click', handleWindowClick);
  }, []);

  const roles: UserRole[] = [
    'Administrator',
    'Nutritionist',
    'Inventory Manager',
    'Kitchen Staff',
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchVal.trim()) return;
    router.push(`/students?search=${encodeURIComponent(searchVal)}`);
    setSearchVal('');
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-xs sm:px-6">
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden flex items-center justify-center p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-md hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder="Search students, recipes, ingredients, POs..."
            className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50/80 pl-9 pr-4 text-xs font-normal text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent transition-all"
          />
        </form>
      </div>

      <div className="flex items-center gap-2 sm:gap-3" onClick={(e) => e.stopPropagation()}>
        <div className="hidden md:flex">
          <DemoDataPill />
        </div>

        <div className="relative">
          <button
            onClick={() => {
              setIsRoleMenuOpen(!isRoleMenuOpen);
              setIsNotificationsOpen(false);
              setIsProfileMenuOpen(false);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-emerald-700/20 bg-emerald-50/80 text-emerald-900 text-xs font-medium hover:bg-emerald-100/80 transition-colors"
            title="Preview role-based UI capabilities"
          >
            <Shield className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span className="hidden sm:inline font-semibold">{activeRole}</span>
            <span className="sm:hidden font-semibold text-[10px]">Role</span>
            <ChevronDown className="w-3 h-3 text-emerald-700 opacity-80" />
          </button>

          {isRoleMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 bg-white py-2 shadow-xl z-50 text-xs">
              <div className="px-3 py-1.5 border-b border-slate-100">
                <p className="font-semibold text-slate-900">Switch Preview Role</p>
                <p className="text-[11px] text-slate-500">
                  Test UI permissions for different school staff roles
                </p>
              </div>
              <div className="py-1">
                {roles.map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      setActiveRole(r);
                      setIsRoleMenuOpen(false);
                    }}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-50 transition-colors',
                      activeRole === r ? 'font-semibold text-emerald-800 bg-emerald-50/50' : 'text-slate-700'
                    )}
                  >
                    <span>{r}</span>
                    {activeRole === r && <Check className="w-4 h-4 text-emerald-700" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => {
              setIsNotificationsOpen(!isNotificationsOpen);
              setIsProfileMenuOpen(false);
              setIsRoleMenuOpen(false);
            }}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-amber-500 ring-2 ring-white" />
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-slate-200 bg-white p-3 shadow-xl z-50">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                <span className="font-semibold text-xs text-slate-900">Operational Alerts</span>
                <span className="text-[10px] text-emerald-800 font-semibold cursor-pointer hover:underline">
                  Mark all as read
                </span>
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                <div className="flex items-start gap-2.5 p-2 rounded-lg bg-amber-50 border border-amber-100 text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-950">Low Stock: Organic Whole Milk</p>
                    <p className="text-[11px] text-amber-800">Available: 18 L (Minimum required: 50 L)</p>
                    <span className="text-[10px] text-amber-600">20 minutes ago</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2 rounded-lg bg-rose-50 border border-rose-100 text-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-rose-950">Expiry Warning: Cheddar Cheese Block</p>
                    <p className="text-[11px] text-rose-800">Batch #CH-994 expires in 48 hours</p>
                    <span className="text-[10px] text-rose-600">1 hour ago</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                  <Info className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-900">PO #PO-2026-004 Delivered</p>
                    <p className="text-[11px] text-slate-600">Valley Fresh Farms delivered 12 items</p>
                    <span className="text-[10px] text-slate-400">3 hours ago</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => {
              setIsProfileMenuOpen(!isProfileMenuOpen);
              setIsNotificationsOpen(false);
              setIsRoleMenuOpen(false);
            }}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white text-xs font-bold">
              {currentUser.name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')}
            </div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-900 leading-tight">
                {currentUser.name}
              </span>
              <span className="text-[10px] text-slate-500 leading-tight">
                {currentUser.role}
              </span>
            </div>
            <ChevronDown className="hidden lg:block w-3.5 h-3.5 text-slate-400" />
          </button>

          {isProfileMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white py-2 shadow-xl z-50 text-xs">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="font-semibold text-slate-900">{currentUser.name}</p>
                <p className="text-[11px] text-slate-500">{currentUser.email}</p>
                <p className="text-[10px] text-emerald-800 font-medium mt-1">
                  {currentUser.schoolName}
                </p>
              </div>
              <div className="py-1">
                <button
                  onClick={() => router.push('/settings')}
                  className="w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  System Settings
                </button>
                <button
                  onClick={() => router.push('/reports')}
                  className="w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Generate Reports
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
