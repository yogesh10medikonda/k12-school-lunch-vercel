'use client';

import * as React from 'react';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { Modal } from './modal';
import { Button } from './button';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isLoading = false,
}: ConfirmDialogProps) {
  const icon =
    variant === 'danger' ? (
      <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
        <AlertTriangle className="w-5 h-5" />
      </div>
    ) : variant === 'warning' ? (
      <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
        <AlertCircle className="w-5 h-5" />
      </div>
    ) : (
      <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
        <Info className="w-5 h-5" />
      </div>
    );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          {icon}
          <span>{title}</span>
        </div>
      }
      maxWidth="md"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={variant === 'danger' ? 'destructive' : variant === 'warning' ? 'warning' : 'default'}
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-slate-600 text-sm leading-relaxed">{description}</p>
    </Modal>
  );
}
