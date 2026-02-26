import { GoBlinkValidationError } from '../errors.js';

/**
 * Validate a transfer amount
 * @param amount - Human-readable amount string
 * @param decimals - Token decimal places
 * @throws GoBlinkValidationError if the amount is invalid
 */
export function validateAmount(amount: string, decimals: number): void {
  if (!amount || amount.trim() === '') {
    throw new GoBlinkValidationError('Amount is required', 'amount');
  }

  const num = Number(amount);
  if (isNaN(num)) {
    throw new GoBlinkValidationError('Amount must be a valid number', 'amount');
  }

  if (num <= 0) {
    throw new GoBlinkValidationError('Amount must be greater than 0', 'amount');
  }

  // Check decimal precision
  const parts = amount.split('.');
  if (parts[1] && parts[1].length > decimals) {
    throw new GoBlinkValidationError(
      `Amount has too many decimal places (max ${decimals})`,
      'amount',
    );
  }
}
