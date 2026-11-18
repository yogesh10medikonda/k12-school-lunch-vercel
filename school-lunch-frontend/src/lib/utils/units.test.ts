import {
  toBaseUnit,
  convertUnit,
  calculateIngredientNeed,
} from './units';

export function runUnitsTests() {
  // Test 1: Base unit conversion for mass (kg to g)
  const massBase = toBaseUnit(2.5, 'kg');
  if (massBase.quantity !== 2500 || massBase.baseUnit !== 'g') {
    throw new Error(`Test 1 Failed: Expected 2500g, got ${massBase.quantity}${massBase.baseUnit}`);
  }

  // Test 2: Base unit conversion for volume (L to ml)
  const volBase = toBaseUnit(1.5, 'l');
  if (volBase.quantity !== 1500 || volBase.baseUnit !== 'ml') {
    throw new Error(`Test 2 Failed: Expected 1500ml, got ${volBase.quantity}${volBase.baseUnit}`);
  }

  // Test 3: Unit conversion g to kg
  const converted = convertUnit(3500, 'g', 'kg');
  if (converted !== 3.5) {
    throw new Error(`Test 3 Failed: Expected 3.5kg, got ${converted}`);
  }

  // Test 4: Domain calculation - Ingredient Need = quantity per serving x servings
  const need = calculateIngredientNeed(75, 200, 'g', 'kg');
  if (need.totalQuantity !== 15 || need.unit !== 'kg') {
    throw new Error(`Test 4 Failed: Expected 15kg, got ${need.totalQuantity}${need.unit}`);
  }

  return true;
}
