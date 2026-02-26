/**
 * Convert a human-readable amount to atomic (integer) representation
 * @param amount - Human-readable amount (e.g., "1.5")
 * @param decimals - Number of decimal places for the token
 * @returns Atomic amount as string (e.g., "1500000" for 1.5 with 6 decimals)
 */
export function toAtomicAmount(amount: string, decimals: number): string {
  const [whole = '0', frac = ''] = amount.split('.');
  const paddedFrac = frac.padEnd(decimals, '0').slice(0, decimals);
  const raw = whole + paddedFrac;
  // Strip leading zeros but keep at least one digit
  return raw.replace(/^0+/, '') || '0';
}

/**
 * Convert an atomic amount to human-readable representation
 * @param atomicAmount - Atomic amount as string (e.g., "1500000")
 * @param decimals - Number of decimal places for the token
 * @returns Human-readable amount (e.g., "1.5")
 */
export function fromAtomicAmount(atomicAmount: string, decimals: number): string {
  if (decimals === 0) return atomicAmount;

  const padded = atomicAmount.padStart(decimals + 1, '0');
  const wholeEnd = padded.length - decimals;
  const whole = padded.slice(0, wholeEnd);
  const frac = padded.slice(wholeEnd).replace(/0+$/, '');

  if (!frac) return whole;
  return `${whole}.${frac}`;
}

/**
 * Truncate an address for display
 * @param address - Full address string
 * @param startChars - Number of characters to keep at start (default: 6)
 * @param endChars - Number of characters to keep at end (default: 4)
 */
export function truncateAddress(address: string, startChars = 6, endChars = 4): string {
  if (address.length <= startChars + endChars + 3) return address;
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Format a USD amount for display
 * @param amount - Amount in USD
 */
export function formatUsd(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
