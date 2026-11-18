/**
 * Unit conversion barrel — re-exports everything from utils/units.ts
 * Import directly: import { convertUnit, calculateIngredientNeed } from '@/lib/units'
 */
export type { MassUnit, VolumeUnit, CountUnit, UnitOfMeasure, UnitCategory } from './utils/units';
export {
  getUnitCategory,
  toBaseUnit,
  convertUnit,
  calculateIngredientNeed,
  formatUnitQuantity,
} from './utils/units';
