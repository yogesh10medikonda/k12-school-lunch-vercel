/**
 * Shared formatting utilities for numbers, currencies, dates, and sensitive data masking.
 */

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatPercent(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatDate(dateStringOrDate: string | Date): string {
  if (!dateStringOrDate) return '—';
  const date = typeof dateStringOrDate === 'string' ? new Date(dateStringOrDate) : dateStringOrDate;
  if (isNaN(date.getTime())) return 'Invalid date';

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function formatDateTime(dateStringOrDate: string | Date): string {
  if (!dateStringOrDate) return '—';
  const date = typeof dateStringOrDate === 'string' ? new Date(dateStringOrDate) : dateStringOrDate;
  if (isNaN(date.getTime())) return 'Invalid date';

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

/**
 * Domain rule: Student allergy/dietary data is sensitive.
 * Mask in lists where possible.
 */
export function maskSensitiveDietary(allergies?: string[], masked: boolean = true): string {
  if (!allergies || allergies.length === 0) {
    return 'None documented';
  }

  if (masked) {
    return `${allergies.length} Flagged (${allergies.slice(0, 1).join('')}${allergies.length > 1 ? ', ...' : ''})`;
  }

  return allergies.join(', ');
}
