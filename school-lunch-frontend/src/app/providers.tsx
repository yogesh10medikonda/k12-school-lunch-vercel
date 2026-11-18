'use client';

import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RoleProvider } from '@/lib/auth/roles';
import { ToastProvider } from '@/components/ui/toast';
import { AppLayout } from '@/components/layout/app-layout';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            staleTime: 1000 * 60 * 5,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <RoleProvider>
        <ToastProvider>
          <AppLayout>{children}</AppLayout>
        </ToastProvider>
      </RoleProvider>
    </QueryClientProvider>
  );
}
