/**
 * Format weight in grams to a readable format
 */
export function formatWeight(grams: number, unit: 'kg' | 'g' | 'auto' = 'auto'): string {
  if (unit === 'kg') {
    return `${(grams / 1000).toFixed(2)} kg`;
  }

  if (unit === 'g') {
    return `${grams} g`;
  }

  // Auto mode: use kg if >= 1000g, otherwise use g
  if (grams >= 1000) {
    return `${(grams / 1000).toFixed(2)} kg`;
  }

  return `${grams} g`;
}

/**
 * Convert grams to kilograms
 */
export function gramsToKg(grams: number): number {
  return grams / 1000;
}

/**
 * Convert kilograms to grams
 */
export function kgToGrams(kg: number): number {
  return kg * 1000;
}

/**
 * Parse weight string to grams
 */
export function parseWeight(value: string): number {
  const cleaned = value.toLowerCase().trim();

  if (cleaned.includes('kg')) {
    const kg = parseFloat(cleaned.replace('kg', '').trim());
    return kgToGrams(kg);
  }

  const grams = parseFloat(cleaned.replace('g', '').trim());
  return grams || 0;
}

/**
 * Calculate total weight from items
 */
export function calculateTotalWeight(items: Array<{ weight: number; quantity: number }>): number {
  return items.reduce((total, item) => total + (item.weight * item.quantity), 0);
}

/**
 * Format weight per hour (for machines)
 */
export function formatWeightPerHour(kgPerHour: number): string {
  return `${kgPerHour} kg/h`;
}
