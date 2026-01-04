/**
 * Format a number as currency in XOF (Francs CFA)
 */
export function formatCurrency(amount: number, currency: 'XOF' | 'EUR' = 'XOF'): string {
  if (currency === 'XOF') {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

/**
 * Format a number as XOF (Francs CFA) - shorthand
 */
export function formatXOF(amount: number): string {
  return formatCurrency(amount, 'XOF');
}

/**
 * Format a number as EUR - shorthand
 */
export function formatEUR(amount: number): string {
  return formatCurrency(amount, 'EUR');
}

/**
 * Parse a currency string to number
 */
export function parseCurrency(value: string): number {
  const cleaned = value.replace(/[^0-9,-]/g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}

/**
 * Calculate percentage change
 */
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Format percentage with sign
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}
