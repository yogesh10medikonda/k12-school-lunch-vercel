'use client';

import * as React from 'react';
import { Database, Info, RefreshCw, X } from 'lucide-react';
import { USE_MOCKS } from '@/lib/api/client';

export function DemoDataBanner() {
  const [dismissed, setDismissed] = React.useState(false);

  if (!USE_MOCKS || dismissed) return null;

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-1.5 text-xs text-amber-900 flex items-center justify-between transition-colors">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 uppercase tracking-wider text-[10px]">
          <Database className="w-3 h-3" /> Demo Data Mode
        </span>
        <span className="hidden sm:inline text-amber-800">
          Viewing local mock data. Backend MongoDB switch is active via <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">NEXT_PUBLIC_USE_MOCKS</code>.
        </span>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.location.reload();
            }
          }}
          className="hover:underline flex items-center gap-1 font-medium text-amber-800"
          title="Reset or refresh view"
        >
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="text-amber-700 hover:text-amber-900 p-0.5 rounded"
          aria-label="Dismiss demo banner"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export function DemoDataPill() {
  if (!USE_MOCKS) return null;

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-100 text-amber-800 border border-amber-200"
      title="This view uses realistic local mock data"
    >
      <Info className="w-3 h-3" />
      Demo Data
    </span>
  );
}
