/**
 * Unit conversion utilities (mirrors src/lib/utils/units.ts in the frontend).
 * Domain rule: store one base unit per ingredient — mass → g, volume → ml,
 * count → unit. Convert through this central util.
 */
const MASS_TO_BASE_GRAMS = {
  g: 1,
  kg: 1000,
  oz: 28.3495,
  lb: 453.592,
};

const VOLUME_TO_BASE_ML = {
  ml: 1,
  l: 1000,
  tsp: 4.92892,
  tbsp: 14.7868,
  cup: 240,
  fl_oz: 29.5735,
};

export const getUnitCategory = (unit) => {
  if (unit in MASS_TO_BASE_GRAMS) return 'mass';
  if (unit in VOLUME_TO_BASE_ML) return 'volume';
  return 'count';
};

export const toBaseUnit = (quantity, unit) => {
  if (quantity < 0) throw new Error(`Quantity cannot be negative: ${quantity}`);
  const category = getUnitCategory(unit);
  if (category === 'mass') {
    const factor = MASS_TO_BASE_GRAMS[unit];
    return { quantity: Number((quantity * factor).toFixed(4)), baseUnit: 'g' };
  }
  if (category === 'volume') {
    const factor = VOLUME_TO_BASE_ML[unit];
    return { quantity: Number((quantity * factor).toFixed(4)), baseUnit: 'ml' };
  }
  return { quantity, baseUnit: 'unit' };
};

export const convertUnit = (quantity, fromUnit, toUnit) => {
  if (fromUnit === toUnit) return quantity;
  const fromCategory = getUnitCategory(fromUnit);
  const toCategory = getUnitCategory(toUnit);
  if (fromCategory !== toCategory) {
    throw new Error(
      `Incompatible unit conversion: ${fromCategory} (${fromUnit}) to ${toCategory} (${toUnit}).`
    );
  }
  if (fromCategory === 'mass') {
    const baseGrams = quantity * MASS_TO_BASE_GRAMS[fromUnit];
    return Number((baseGrams / MASS_TO_BASE_GRAMS[toUnit]).toFixed(4));
  }
  if (fromCategory === 'volume') {
    const baseMl = quantity * VOLUME_TO_BASE_ML[fromUnit];
    return Number((baseMl / VOLUME_TO_BASE_ML[toUnit]).toFixed(4));
  }
  return quantity;
};

export const calculateIngredientNeed = (
  quantityPerServing,
  servings,
  servingUnit,
  targetUnit
) => {
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
};