/** Options for creating a payment link */
export interface PaymentLinkOptions {
  /** Recipient wallet address */
  recipient: string;
  /** Destination chain identifier */
  chain: string;
  /** Token symbol (e.g., "USDC") */
  token: string;
  /** Fixed amount — if omitted, payer chooses */
  amount?: string;
  /** Optional message (e.g., "Invoice #42") */
  message?: string;
  /** Redirect URL after payment */
  redirect?: string;
}

/** Options for creating a short payment link */
export interface ShortenOptions {
  /** Recipient wallet address */
  recipient: string;
  /** Destination chain identifier */
  chain: string;
  /** Token symbol (e.g., "USDC") */
  token: string;
  /** Payment amount */
  amount: string;
  /** Optional memo/message */
  memo?: string;
  /** Requester display name */
  name?: string;
}

/** Response from the shorten endpoint */
export interface ShortenResponse {
  /** Short link ID */
  id: string;
  /** Full short URL (e.g., "https://goblink.io/pay/AbC12xYz") */
  url: string;
}

/** Options for creating a README badge */
export interface BadgeOptions {
  /** Recipient wallet address */
  recipient: string;
  /** Destination chain identifier */
  chain: string;
  /** Token symbol (e.g., "USDC") */
  token: string;
  /** Badge label text (default: "Donate with goBlink") */
  label?: string;
  /** Fixed amount — if omitted, payer chooses */
  amount?: string;
  /** Badge color (default: "blue") */
  color?: string;
}
