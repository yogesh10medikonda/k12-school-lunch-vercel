/**
 * General utilities barrel — re-exports cn, formatters.
 * Import directly from here: import { cn, formatDate } from '@/lib/utils'
 */
export { cn } from './utils/cn';
export {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatDate,
  formatDateTime,
  maskSensitiveDietary,
} from './utils/formatters';
