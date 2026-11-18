
'use client';

import * as React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export type ToastType = 'success' | 'warning' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextType {
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  success: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = React.useCallback(
    (toast: Omit<ToastMessage, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastMessage = { ...toast, id };

      setToasts((prev) => [...prev, newToast]);

      const duration = toast.duration || 4500;
      setTimeout(() => removeToast(id), duration);
    },
    [removeToast]
  );

  const success = React.useCallback(
    (title: string, description?: string) =>
      addToast({ type: 'success', title, description }),
    [addToast]
  );

  const warning = React.useCallback(
    (title: string, description?: string) =>
      addToast({ type: 'warning', title, description }),
    [addToast]
  );

  const error = React.useCallback(
    (title: string, description?: string) =>
      addToast({ type: 'error', title, description }),
    [addToast]
  );

  const info = React.useCallback(
    (title: string, description?: string) =>
      addToast({ type: 'info', title, description }),
    [addToast]
  );

  const actions = React.useMemo(
    () => ({ addToast, removeToast, success, warning, error, info }),
    [addToast, removeToast, success, warning, error, info]
  );

  return (
    <ToastContext.Provider value={actions}>
      {children}

      <div
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map((toast) => {
          const icon =
            toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : toast.type === 'warning' ? (
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            ) : toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
            );

          const borderBg =
            toast.type === 'success'
              ? 'border-emerald-200 bg-emerald-50/90 text-emerald-950'
              : toast.type === 'warning'
              ? 'border-amber-200 bg-amber-50/90 text-amber-950'
              : toast.type === 'error'
              ? 'border-rose-200 bg-rose-50/90 text-rose-950'
              : 'border-blue-200 bg-blue-50/90 text-blue-950';

          return (
            <div
              key={toast.id}
              className={cn(
                'pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-lg backdrop-blur-xs transition-all duration-200 animate-in slide-in-from-bottom-2',
                borderBg
              )}
              role="alert"
            >
              <div className="mt-0.5">{icon}</div>

              <div className="flex-1 space-y-0.5">
                <p className="text-xs font-semibold leading-tight">{toast.title}</p>
                {toast.description && (
                  <p className="text-xs opacity-90 font-normal leading-normal">
                    {toast.description}
                  </p>
                )}
              </div>

              <button
                onClick={() => removeToast(toast.id)}
                className="opacity-70 hover:opacity-100 p-0.5 rounded transition-opacity"
                aria-label="Dismiss toast"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextType {
  const context = React.useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  return context;
}
