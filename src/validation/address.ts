import type { ChainId } from '../chains/types.js';

/** Per-chain address validation patterns */
const ADDRESS_PATTERNS: Partial<Record<ChainId, RegExp[]>> = {
  // EVM chains share the same pattern
  ethereum: [/^0x[a-fA-F0-9]{40}$/],
  base: [/^0x[a-fA-F0-9]{40}$/],
  arbitrum: [/^0x[a-fA-F0-9]{40}$/],
  bnb: [/^0x[a-fA-F0-9]{40}$/],
  polygon: [/^0x[a-fA-F0-9]{40}$/],
  optimism: [/^0x[a-fA-F0-9]{40}$/],
  avalanche: [/^0x[a-fA-F0-9]{40}$/],
  gnosis: [/^0x[a-fA-F0-9]{40}$/],
  berachain: [/^0x[a-fA-F0-9]{40}$/],
  monad: [/^0x[a-fA-F0-9]{40}$/],
  aurora: [/^0x[a-fA-F0-9]{40}$/],
  xlayer: [/^0x[a-fA-F0-9]{40}$/],

  // Non-EVM chains
  solana: [/^[1-9A-HJ-NP-Za-km-z]{32,44}$/],
  sui: [/^0x[a-fA-F0-9]{64}$/],
  near: [
    /^([a-z0-9_-]+\.)*[a-z0-9_-]+$/, // named account (2-64 chars)
    /^[a-f0-9]{64}$/,                 // implicit account
  ],
  bitcoin: [/^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/],
  tron: [/^T[1-9A-HJ-NP-Za-km-z]{33}$/],
  ton: [/^(EQ|UQ)[a-zA-Z0-9_-]{46}$/],
  stellar: [/^G[A-Z2-7]{55}$/],
  xrp: [/^r[1-9A-HJ-NP-Za-km-z]{24,34}$/],
  starknet: [/^0x[a-fA-F0-9]{1,64}$/],
  aptos: [/^0x[a-fA-F0-9]{1,64}$/],
};

/**
 * Validate an address for a specific chain
 * @param chain - Chain identifier
 * @param address - Address to validate
 * @returns true if the address is valid for the given chain
 */
export function validateAddress(chain: ChainId, address: string): boolean {
  const patterns = ADDRESS_PATTERNS[chain];

  // If no pattern is defined for this chain, we can't validate — accept it
  if (!patterns) return true;

  // For NEAR, also check length constraints on named accounts
  if (chain === 'near') {
    // Implicit account
    if (/^[a-f0-9]{64}$/.test(address)) return true;
    // Named account: 2-64 chars
    if (address.length >= 2 && address.length <= 64 && /^([a-z0-9_-]+\.)*[a-z0-9_-]+$/.test(address)) return true;
    return false;
  }

  return patterns.some((pattern) => pattern.test(address));
}
