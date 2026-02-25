# @goblink/sdk — Build Specification

You are building a public TypeScript SDK for goBlink, a cross-chain token transfer platform.
The SDK wraps an underlying cross-chain swap API and exposes a clean, goBlink-branded interface.

## CRITICAL RULES

1. **NO references to NEAR, 1Click, Intents, Defuse, NEP-141, chaindefuser, or defuse-protocol in ANY public-facing code** — no exported types, no public method names, no error messages, no JSDoc, no README. These are internal implementation details only.
2. **All public types use goBlink's own asset ID format** (e.g., `ethereum:usdc`, `solana:native`). Internal code maps to/from the protocol's `nep141:*` format.
3. **Revenue is baked in.** Default fee tiers are enforced on every quote. The SDK is how we monetize third-party integrations.

## Package Info

- **Name:** `@goblink/sdk`
- **Repo:** Will be published to npm (public)
- **Build:** ESM + CJS dual output, TypeScript declarations
- **Test:** Vitest
- **Node:** >=18

## Architecture

```
src/
├── index.ts               # Public exports
├── client.ts              # GoBlink class — main entry point
├── tokens/
│   ├── list.ts            # Fetch + cache token list
│   ├── filter.ts          # Filter by chain, search, deduplicate
│   ├── icons.ts           # Token icon mapping
│   └── types.ts           # Token, Chain, AssetId types
├── quotes/
│   ├── get-quote.ts       # Request quote from underlying API
│   ├── types.ts           # QuoteRequest, QuoteResponse
│   └── fees.ts            # Fee calculation (tiered bps, min floor)
├── transfers/
│   ├── create.ts          # Create transfer → get deposit address
│   ├── status.ts          # Poll transfer status
│   └── types.ts           # TransferRequest, TransferStatus
├── validation/
│   ├── address.ts         # Per-chain address validation
│   └── amount.ts          # Min/max, decimal precision
├── chains/
│   ├── config.ts          # Chain definitions, explorers
│   └── types.ts           # Chain types
├── internal/
│   ├── api-client.ts      # HTTP client for the underlying swap API (1Click — INTERNAL ONLY)
│   ├── asset-mapping.ts   # Maps goBlink asset IDs ↔ protocol asset IDs (INTERNAL ONLY)
│   └── types.ts           # Internal protocol types (INTERNAL ONLY, NOT exported)
└── utils/
    ├── format.ts          # Amount formatting, address truncation
    └── cache.ts           # Simple TTL cache (in-memory)
```

## Public API Surface

```typescript
import { GoBlink } from '@goblink/sdk';

const gb = new GoBlink({
  // Optional — defaults to goBlink standard tiers
  fees: [
    { maxAmountUsd: 5000, bps: 35 },    // Under $5K → 0.35%
    { maxAmountUsd: 50000, bps: 10 },   // $5K–$50K → 0.10%
    { maxAmountUsd: null, bps: 5 },     // Over $50K → 0.05%
  ],
  minFee: 5,          // Minimum bps floor (default 5)
  feeRecipient: 'goblink.near',  // Default, can be overridden by partners
});

// Get all supported tokens
const tokens = await gb.getTokens();

// Get tokens filtered by chain
const ethTokens = await gb.getTokens({ chain: 'ethereum' });

// Get a quote
const quote = await gb.getQuote({
  from: { chain: 'ethereum', token: 'USDC' },
  to: { chain: 'solana', token: 'USDC' },
  amount: '100',        // Human-readable amount (not atomic)
  recipient: '7xKp...3mNw',
  refundAddress: '0xABC...123',
});
// Returns: { quoteId, depositAddress, amountIn, amountOut, fee, rate, estimatedTime, expiresAt }

// Create a transfer (non-dry quote)
const transfer = await gb.createTransfer({
  from: { chain: 'ethereum', token: 'USDC' },
  to: { chain: 'solana', token: 'USDC' },
  amount: '100',
  recipient: '7xKp...3mNw',
  refundAddress: '0xABC...123',
});
// Returns: { id, depositAddress, depositAmount, expiresAt }

// Check transfer status
const status = await gb.getTransferStatus(depositAddress);
// Returns: { status: 'PROCESSING' | 'SUCCESS' | 'FAILED' | ..., txHash?, explorerUrl? }

// Validate an address for a chain
const valid = gb.validateAddress('solana', '7xKp...3mNw'); // boolean

// Get supported chains
const chains = gb.getChains();
// Returns: [{ id: 'ethereum', name: 'Ethereum', type: 'evm', explorer, nativeToken }]

// Calculate fee for an amount
const fee = gb.calculateFee(1000); // { bps: 35, percent: '0.35', tier: 'Standard' }
```

## Fee Tiers (Default)

| Range | BPS | Percent | Tier Label |
|-------|-----|---------|------------|
| Under $5,000 | 35 | 0.35% | Standard |
| $5,000–$50,000 | 10 | 0.10% | Pro |
| Over $50,000 | 5 | 0.05% | Whale |

- Fee recipient default: `goblink.near`
- Minimum floor: 5 bps (configurable)
- Fees are passed as `appFees` param to the underlying API

## Internal API (1Click — NEVER EXPORTED)

Base URL: `https://1click.chaindefuser.com`

### Endpoints Used:
- `GET /tokens` — list all supported tokens
- `POST /quote` — get a swap quote (dry=true for quote, dry=false for real transfer)
- `POST /submit-deposit-tx` — notify of deposit transaction
- `GET /execution-status/{depositAddress}` — check transfer status

### Asset ID Mapping (Internal)

The underlying API uses `nep141:*` and protocol-specific asset IDs. The SDK uses goBlink format.

**goBlink format:** `{chain}:{token_symbol_lowercase}` for common tokens, or `{chain}:{contract_address}` for specific tokens.

**Internal mapping examples:**
- `ethereum:usdc` → look up in token list, find `defuseAssetId` → `nep141:a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.factory.bridge.near` (or whatever it maps to)
- `solana:native` → `nep141:sol.omft.near`
- `sui:native` → `nep141:sui.omft.near`

**Strategy:** Fetch the token list from the API, build a lookup map from goBlink IDs to protocol IDs. The token list from the API contains `assetId` (protocol format) which we use for API calls, and we expose user-friendly identifiers.

### Quote Request Shape (Internal)

```typescript
// This is what gets sent to the 1Click API — INTERNAL ONLY
{
  dry: boolean,
  originAsset: string,      // Protocol asset ID (nep141:...)
  destinationAsset: string,  // Protocol asset ID
  amount: string,            // Atomic amount (big integer string)
  recipient: string,
  refundTo: string,
  swapType: 'EXACT_INPUT' | 'EXACT_OUTPUT',
  slippageTolerance: number, // basis points (default 100 = 1%)
  deadline: string,          // ISO date
  depositType: 'ORIGIN_CHAIN',
  recipientType: 'DESTINATION_CHAIN',
  refundType: 'ORIGIN_CHAIN',
  appFees: [{ recipient: string, fee: number }],
}
```

## Chain Configs

Include these chains with their configs (explorer URLs, native tokens, etc.):

### EVM Chains
- Ethereum (id: 1), Base (8453), Arbitrum (42161), BNB Chain (56), Polygon (137), Optimism (10), Avalanche (43114), Gnosis (100), Berachain (80094), Monad (143), Aurora (1313161554), X Layer (196)

### Non-EVM Chains
- NEAR, Solana, Sui, Bitcoin, Litecoin, Dogecoin, Bitcoin Cash, Tron, TON, Stellar, XRP, Starknet, Cardano, Aptos, Aleo

## Address Validation

Per-chain regex validation:
- **EVM:** `^0x[a-fA-F0-9]{40}$`
- **Solana:** `^[1-9A-HJ-NP-Za-km-z]{32,44}$` (base58)
- **Sui:** `^0x[a-fA-F0-9]{64}$`
- **NEAR:** Named (`^([a-z0-9_-]+\.)*[a-z0-9_-]+$`, 2-64 chars) or implicit (`^[a-f0-9]{64}$`)
- **Bitcoin:** `^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$`
- **Tron:** `^T[1-9A-HJ-NP-Za-km-z]{33}$`
- **TON:** `^(EQ|UQ)[a-zA-Z0-9_-]{46}$`
- **Stellar:** `^G[A-Z2-7]{55}$`
- **XRP:** `^r[1-9A-HJ-NP-Za-km-z]{24,34}$`
- **Starknet:** `^0x[a-fA-F0-9]{1,64}$`
- **Aptos:** `^0x[a-fA-F0-9]{1,64}$`

## Token Icon Mapping

Include a static mapping of common token symbols to icon URLs. Use cryptocurrency-icons CDN or similar:
```
https://raw.githubusercontent.com/nicehash/cryptocurrency-icons/main/128/{symbol_lowercase}.png
```

## Build Setup

- **tsup** for building (ESM + CJS dual)
- **vitest** for testing
- **tsconfig** with strict mode
- **package.json** with proper exports field, types, files

```json
{
  "name": "@goblink/sdk",
  "version": "0.1.0",
  "description": "Cross-chain token transfers. 26+ chains, 65+ tokens.",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    }
  },
  "files": ["dist"],
  "license": "MIT",
  "keywords": ["crypto", "cross-chain", "swap", "transfer", "defi", "goblink"],
  "repository": { "type": "git", "url": "https://github.com/Urban-Blazer/goblink-sdk" },
  "homepage": "https://goblink.io"
}
```

## README.md

Write a professional README with:
- goBlink branding (tagline: "Move value anywhere, instantly.")
- Install instructions
- Quick start code example
- Full API reference
- Supported chains list
- Fee structure explanation
- License: MIT

**NO mention of NEAR, 1Click, Intents, or any underlying protocol.**

## Tests

Write tests for:
- Fee calculation (all tiers + edge cases + min floor)
- Address validation (all chain types, valid + invalid)
- Asset ID mapping (goBlink format ↔ internal)
- Token filtering
- Amount formatting

## DO NOT

- Export any internal types or functions
- Reference NEAR/1Click/Intents/Defuse in public code
- Use `any` type — strict TypeScript throughout
- Skip error handling — all API calls should have proper error types
- Hardcode the API base URL — make it configurable (with default)

## DO

- Use proper JSDoc on all public methods
- Export clean, well-named types
- Include source maps
- Make it tree-shakeable
- Handle network errors gracefully with typed errors
- Cache token list with configurable TTL (default 5 min)
- Convert human-readable amounts to atomic amounts internally
