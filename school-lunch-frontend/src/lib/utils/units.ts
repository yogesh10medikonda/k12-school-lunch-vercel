/**
 * Central Unit Conversion & Measurement Utility
 * Domain rule: Store one base unit per ingredient category; convert units through this central util.
 * Standard base units:
 * - Mass: 'g' (grams)
 * - Volume: 'ml' (milliliters)
 * - Count: 'unit' (individual items / count)
 */

export type MassUnit = 'g' | 'kg' | 'oz' | 'lb';
export type VolumeUnit = 'ml' | 'l' | 'tsp' | 'tbsp' | 'cup' | 'fl_oz';
export type CountUnit = 'unit' | 'case' | 'box' | 'can' | 'pack';
export type UnitOfMeasure = MassUnit | VolumeUnit | CountUnit;

export type UnitCategory = 'mass' | 'volume' | 'count';

const MASS_TO_BASE_GRAMS: Record<MassUnit, number> = {
  g: 1,
  kg: 1000,
  oz: 28.3495,
  lb: 453.592,
};

const VOLUME_TO_BASE_ML: Record<VolumeUnit, number> = {
  ml: 1,
  l: 1000,
  tsp: 4.92892,
  tbsp: 14.7868,
  cup: 240,
  fl_oz: 29.5735,
};

export function getUnitCategory(unit: UnitOfMeasure): UnitCategory {
  if (unit in MASS_TO_BASE_GRAMS) return 'mass';
  if (unit in VOLUME_TO_BASE_ML) return 'volume';
  return 'count';
}

export function toBaseUnit(
  quantity: number,
  unit: UnitOfMeasure
): { quantity: number; baseUnit: UnitOfMeasure } {
  if (quantity < 0) {
    throw new Error(`Quantity cannot be negative: ${quantity}`);
  }

  const category = getUnitCategory(unit);

  if (category === 'mass') {
    const factor = MASS_TO_BASE_GRAMS[unit as MassUnit];
    return {
      quantity: Number((quantity * factor).toFixed(4)),
      baseUnit: 'g',
    };
  }

  if (category === 'volume') {
    const factor = VOLUME_TO_BASE_ML[unit as VolumeUnit];
    return {
      quantity: Number((quantity * factor).toFixed(4)),
      baseUnit: 'ml',
    };
  }

  return {
    quantity,
    baseUnit: 'unit',
  };
}

export function convertUnit(
  quantity: number,
  fromUnit: UnitOfMeasure,
  toUnit: UnitOfMeasure
): number {
  if (fromUnit === toUnit) {
    return quantity;
  }

  const fromCategory = getUnitCategory(fromUnit);
  const toCategory = getUnitCategory(toUnit);

  if (fromCategory !== toCategory) {
    throw new Error(
      `Incompatible unit conversion: Cannot convert ${fromCategory} (${fromUnit}) to ${toCategory} (${toUnit}).`
    );
  }

  if (fromCategory === 'mass') {
    const baseGrams = quantity * MASS_TO_BASE_GRAMS[fromUnit as MassUnit];
    const target = baseGrams / MASS_TO_BASE_GRAMS[toUnit as MassUnit];
    return Number(target.toFixed(4));
  }

  if (fromCategory === 'volume') {
    const baseMl = quantity * VOLUME_TO_BASE_ML[fromUnit as VolumeUnit];
    const target = baseMl / VOLUME_TO_BASE_ML[toUnit as VolumeUnit];
    return Number(target.toFixed(4));
  }

  return quantity;
}

export function calculateIngredientNeed(
  quantityPerServing: number,
  servings: number,
  servingUnit: UnitOfMeasure,
  targetUnit?: UnitOfMeasure
): { totalQuantity: number; unit: UnitOfMeasure } {
  if (quantityPerServing < 0 || servings < 0) {
    throw new Error('Servings and quantity per serving must be non-negative.');
  }

  const rawTotal = quantityPerServing * servings;

  if (targetUnit && targetUnit !== servingUnit) {
    return {
      totalQuantity: convertUnit(rawTotal, servingUnit, targetUnit),
      unit: targetUnit,
    };
  }

  return {
    totalQuantity: Number(rawTotal.toFixed(4)),
    unit: servingUnit,
  };
}

export function formatUnitQuantity(quantity: number, unit: UnitOfMeasure): string {
  if (unit === 'g' && quantity >= 1000) {
    return `${(quantity / 1000).toLocaleString(undefined, { maximumFractionDigits: 2 })} kg`;
  }
  if (unit === 'kg' && quantity < 1) {
    return `${(quantity * 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })} g`;
  }
  if (unit === 'ml' && quantity >= 1000) {
    return `${(quantity / 1000).toLocaleString(undefined, { maximumFractionDigits: 2 })} L`;
  }
  if (unit === 'l' && quantity < 1) {
    return `${(quantity * 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })} ml`;
  }

  return `${quantity.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${unit}`;
}
