import type { PaymentLinkOptions, BadgeOptions, ShortenOptions, ShortenResponse } from './types.js';
import { GoBlinkApiError, GoBlinkNetworkError } from '../errors.js';

const BASE_URL = 'https://goblink.io/pay';
const SHORTEN_URL = 'https://goblink.io/api/pay/shorten';
const SHIELDS_URL = 'https://img.shields.io/badge';

/**
 * Build a goblink.io payment link from the given options.
 * All values are URL-encoded automatically.
 */
export function createPaymentLink(options: PaymentLinkOptions): string {
  const params = new URLSearchParams();
  params.set('to', options.recipient);
  params.set('chain', options.chain);
  params.set('token', options.token);
  if (options.amount !== undefined) params.set('amount', options.amount);
  if (options.message !== undefined) params.set('msg', options.message);
  if (options.redirect !== undefined) params.set('redirect', options.redirect);
  return `${BASE_URL}?${params.toString()}`;
}

/**
 * Build a Markdown badge string for embedding in a GitHub README.
 *
 * @example
 * ```
 * [![Donate with goBlink](https://img.shields.io/badge/Donate-goBlink-blue)](https://goblink.io/pay?to=0x...)
 * ```
 */
export function createBadge(options: BadgeOptions): string {
  const label = options.label ?? 'Donate with goBlink';
  const color = options.color ?? 'blue';

  const payUrl = createPaymentLink({
    recipient: options.recipient,
    chain: options.chain,
    token: options.token,
    amount: options.amount,
  });

  // Shields.io format: label-message-color (encode hyphens in values)
  const shieldLabel = encodeURIComponent(label);
  const shieldMessage = 'goBlink';
  const imgUrl = `${SHIELDS_URL}/${shieldLabel}-${shieldMessage}-${color}`;

  return `[![${label}](${imgUrl})](${payUrl})`;
}

/**
 * Create a short payment link via the goblink.io API.
 * Returns a short URL like `https://goblink.io/pay/AbC12xYz`.
 *
 * @example
 * ```typescript
 * const short = await shortenPaymentLink({
 *   recipient: '0xABC...123',
 *   chain: 'ethereum',
 *   token: 'USDC',
 *   amount: '50',
 *   memo: 'Invoice #42',
 * });
 * console.log(short.url); // "https://goblink.io/pay/AbC12xYz"
 * ```
 */
export async function shortenPaymentLink(
  options: ShortenOptions,
  timeout = 10000,
): Promise<ShortenResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(SHORTEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: options.recipient,
        toChain: options.chain,
        toToken: options.token,
        amount: options.amount,
        memo: options.memo,
        name: options.name,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new GoBlinkApiError(res.status, body, SHORTEN_URL);
    }

    const data = (await res.json()) as ShortenResponse;
    return data;
  } catch (err) {
    if (err instanceof GoBlinkApiError) throw err;
    if (err instanceof Error && err.name === 'AbortError') {
      throw new GoBlinkNetworkError('Payment link shortener request timed out', SHORTEN_URL);
    }
    throw new GoBlinkNetworkError(
      `Payment link shortener failed: ${err instanceof Error ? err.message : String(err)}`,
      SHORTEN_URL,
    );
  } finally {
    clearTimeout(timer);
  }
}
