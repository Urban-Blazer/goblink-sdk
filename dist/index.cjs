'use strict';

// src/errors.ts
var GoBlinkError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "GoBlinkError";
  }
};
var GoBlinkApiError = class extends GoBlinkError {
  statusCode;
  responseBody;
  url;
  constructor(statusCode, responseBody, url) {
    super(`API request failed with status ${statusCode}`);
    this.name = "GoBlinkApiError";
    this.statusCode = statusCode;
    this.responseBody = responseBody;
    this.url = url;
  }
};
var GoBlinkNetworkError = class extends GoBlinkError {
  url;
  constructor(message, url) {
    super(message);
    this.name = "GoBlinkNetworkError";
    this.url = url;
  }
};
var GoBlinkValidationError = class extends GoBlinkError {
  field;
  constructor(message, field) {
    super(message);
    this.name = "GoBlinkValidationError";
    this.field = field;
  }
};
var GoBlinkAssetNotFoundError = class extends GoBlinkError {
  assetId;
  constructor(assetId) {
    super(`Asset not found: ${assetId}`);
    this.name = "GoBlinkAssetNotFoundError";
    this.assetId = assetId;
  }
};

// src/internal/api-client.ts
var DEFAULT_BASE_URL = "https://1click.chaindefuser.com";
var ApiClient = class {
  baseUrl;
  timeout;
  constructor(options = {}) {
    this.baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
    this.timeout = options.timeout ?? 3e4;
  }
  /** Fetch all supported tokens */
  async getTokens() {
    return this.get("/tokens");
  }
  /** Request a quote (dry=true) or create a transfer (dry=false) */
  async postQuote(request) {
    return this.post("/quote", request);
  }
  /** Check the execution status of a transfer */
  async getExecutionStatus(depositAddress) {
    return this.get(
      `/execution-status/${encodeURIComponent(depositAddress)}`
    );
  }
  async get(path) {
    return this.request(path, { method: "GET" });
  }
  async post(path, body) {
    return this.request(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
  }
  async request(path, init) {
    const url = `${this.baseUrl}${path}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    let response;
    try {
      response = await fetch(url, { ...init, signal: controller.signal });
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new GoBlinkNetworkError(`Request timed out after ${this.timeout}ms`, url);
      }
      throw new GoBlinkNetworkError(
        error instanceof Error ? error.message : "Network request failed",
        url
      );
    } finally {
      clearTimeout(timeoutId);
    }
    if (!response.ok) {
      let errorBody;
      try {
        errorBody = await response.text();
      } catch {
      }
      throw new GoBlinkApiError(response.status, errorBody, url);
    }
    return response.json();
  }
};

// src/tokens/icons.ts
var ICON_CDN_BASE = "https://raw.githubusercontent.com/nicehash/cryptocurrency-icons/main/128";
var ICON_MAP = {
  BTC: `${ICON_CDN_BASE}/btc.png`,
  ETH: `${ICON_CDN_BASE}/eth.png`,
  USDC: `${ICON_CDN_BASE}/usdc.png`,
  USDT: `${ICON_CDN_BASE}/usdt.png`,
  DAI: `${ICON_CDN_BASE}/dai.png`,
  SOL: `${ICON_CDN_BASE}/sol.png`,
  NEAR: `${ICON_CDN_BASE}/near.png`,
  BNB: `${ICON_CDN_BASE}/bnb.png`,
  AVAX: `${ICON_CDN_BASE}/avax.png`,
  MATIC: `${ICON_CDN_BASE}/matic.png`,
  POL: `${ICON_CDN_BASE}/matic.png`,
  DOT: `${ICON_CDN_BASE}/dot.png`,
  DOGE: `${ICON_CDN_BASE}/doge.png`,
  LTC: `${ICON_CDN_BASE}/ltc.png`,
  XRP: `${ICON_CDN_BASE}/xrp.png`,
  XLM: `${ICON_CDN_BASE}/xlm.png`,
  ADA: `${ICON_CDN_BASE}/ada.png`,
  TRX: `${ICON_CDN_BASE}/trx.png`,
  TON: `${ICON_CDN_BASE}/ton.png`,
  SUI: `${ICON_CDN_BASE}/sui.png`,
  APT: `${ICON_CDN_BASE}/apt.png`,
  WBTC: `${ICON_CDN_BASE}/wbtc.png`,
  WETH: `${ICON_CDN_BASE}/weth.png`,
  LINK: `${ICON_CDN_BASE}/link.png`,
  UNI: `${ICON_CDN_BASE}/uni.png`,
  AAVE: `${ICON_CDN_BASE}/aave.png`,
  ARB: `${ICON_CDN_BASE}/arb.png`,
  OP: `${ICON_CDN_BASE}/op.png`,
  BCH: `${ICON_CDN_BASE}/bch.png`,
  STRK: `${ICON_CDN_BASE}/strk.png`
};
function getTokenIcon(symbol) {
  return ICON_MAP[symbol.toUpperCase()] ?? `${ICON_CDN_BASE}/${symbol.toLowerCase()}.png`;
}

// src/internal/asset-mapping.ts
var CHAIN_NAME_MAP = {
  eth: "ethereum",
  ethereum: "ethereum",
  base: "base",
  arbitrum: "arbitrum",
  bsc: "bnb",
  bnb: "bnb",
  polygon: "polygon",
  optimism: "optimism",
  avalanche: "avalanche",
  gnosis: "gnosis",
  berachain: "berachain",
  monad: "monad",
  aurora: "aurora",
  xlayer: "xlayer",
  near: "near",
  solana: "solana",
  sol: "solana",
  sui: "sui",
  bitcoin: "bitcoin",
  btc: "bitcoin",
  litecoin: "litecoin",
  ltc: "litecoin",
  dogecoin: "dogecoin",
  doge: "dogecoin",
  bitcoincash: "bitcoincash",
  bch: "bitcoincash",
  tron: "tron",
  trx: "tron",
  ton: "ton",
  stellar: "stellar",
  xlm: "stellar",
  xrp: "xrp",
  starknet: "starknet",
  cardano: "cardano",
  ada: "cardano",
  aptos: "aptos",
  apt: "aptos",
  aleo: "aleo"
};
var AssetMapper = class {
  /** goBlink asset ID → protocol asset ID (e.g., nep141:...) */
  toProtocol = /* @__PURE__ */ new Map();
  /** protocol asset ID → goBlink asset ID */
  fromProtocol = /* @__PURE__ */ new Map();
  /** goBlink asset ID → Token */
  tokenMap = /* @__PURE__ */ new Map();
  /**
   * Build the mapping from a list of protocol tokens.
   * Called after fetching the token list from the API.
   */
  buildFromProtocolTokens(protocolTokens) {
    this.toProtocol.clear();
    this.fromProtocol.clear();
    this.tokenMap.clear();
    for (const pt of protocolTokens) {
      const chainId = resolveChainId(pt.chainName);
      if (!chainId) continue;
      const symbolLower = pt.symbol.toLowerCase();
      const assetId = pt.address ? `${chainId}:${pt.address.toLowerCase()}` : `${chainId}:${symbolLower}`;
      const symbolAssetId = `${chainId}:${symbolLower}`;
      this.toProtocol.set(assetId, pt.defuseAssetId);
      this.fromProtocol.set(pt.defuseAssetId, assetId);
      if (assetId !== symbolAssetId) {
        this.toProtocol.set(symbolAssetId, pt.defuseAssetId);
      }
      const token = {
        assetId,
        symbol: pt.symbol,
        name: pt.name,
        chain: chainId,
        decimals: pt.decimals,
        address: pt.address,
        icon: pt.icon ?? getTokenIcon(pt.symbol)
      };
      this.tokenMap.set(assetId, token);
    }
  }
  /** Resolve a goBlink asset ID to a protocol asset ID */
  resolveToProtocol(assetId) {
    return this.toProtocol.get(assetId);
  }
  /** Resolve a protocol asset ID to a goBlink asset ID */
  resolveFromProtocol(protocolId) {
    return this.fromProtocol.get(protocolId);
  }
  /** Get all mapped tokens */
  getAllTokens() {
    return Array.from(this.tokenMap.values());
  }
  /** Get a token by its goBlink asset ID */
  getToken(assetId) {
    return this.tokenMap.get(assetId);
  }
  /** Find a token by chain and symbol (case-insensitive) */
  findToken(chain, symbol) {
    const key = `${chain}:${symbol.toLowerCase()}`;
    const protocolId = this.toProtocol.get(key);
    if (!protocolId) return void 0;
    const canonicalId = this.fromProtocol.get(protocolId);
    if (!canonicalId) return void 0;
    return this.tokenMap.get(canonicalId);
  }
};
function resolveChainId(chainName) {
  return CHAIN_NAME_MAP[chainName.toLowerCase()];
}

// src/utils/cache.ts
var TTLCache = class {
  store = /* @__PURE__ */ new Map();
  ttlMs;
  /**
   * Create a new TTL cache
   * @param ttlMs - Time to live in milliseconds (default: 5 minutes)
   */
  constructor(ttlMs = 5 * 60 * 1e3) {
    this.ttlMs = ttlMs;
  }
  /** Get a cached value, or undefined if expired/missing */
  get(key) {
    const entry = this.store.get(key);
    if (!entry) return void 0;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return void 0;
    }
    return entry.value;
  }
  /** Set a value in the cache */
  set(key, value) {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + this.ttlMs
    });
  }
  /** Clear all cached entries */
  clear() {
    this.store.clear();
  }
};

// src/tokens/list.ts
var TokenListProvider = class {
  apiClient;
  mapper;
  cache;
  initialized = false;
  constructor(apiClient, mapper, cacheTtlMs) {
    this.apiClient = apiClient;
    this.mapper = mapper;
    this.cache = new TTLCache(cacheTtlMs);
  }
  /** Get all tokens, fetching from API if not cached */
  async getTokens() {
    const cached = this.cache.get("tokens");
    if (cached) return cached;
    const protocolTokens = await this.apiClient.getTokens();
    this.mapper.buildFromProtocolTokens(protocolTokens);
    const tokens = this.mapper.getAllTokens();
    this.cache.set("tokens", tokens);
    this.initialized = true;
    return tokens;
  }
  /** Ensure the token list has been loaded at least once */
  async ensureInitialized() {
    if (!this.initialized) {
      await this.getTokens();
    }
  }
  /** Clear the cached token list */
  clearCache() {
    this.cache.clear();
    this.initialized = false;
  }
};

// src/tokens/filter.ts
function filterTokens(tokens, options = {}) {
  let result = tokens;
  if (options.chain) {
    result = result.filter((t) => t.chain === options.chain);
  }
  if (options.search) {
    const q = options.search.toLowerCase();
    result = result.filter(
      (t) => t.symbol.toLowerCase().includes(q) || t.name.toLowerCase().includes(q)
    );
  }
  return deduplicateTokens(result);
}
function deduplicateTokens(tokens) {
  const seen = /* @__PURE__ */ new Set();
  const unique = [];
  for (const token of tokens) {
    const key = `${token.chain}:${token.symbol.toLowerCase()}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(token);
    }
  }
  return unique;
}

// src/quotes/fees.ts
var DEFAULT_FEE_TIERS = [
  { maxAmountUsd: 5e3, bps: 35 },
  { maxAmountUsd: 5e4, bps: 10 },
  { maxAmountUsd: null, bps: 5 }
];
var DEFAULT_MIN_FEE_BPS = 5;
var TIER_LABELS = {
  35: "Standard",
  10: "Pro",
  5: "Whale"
};
function calculateFee(amountUsd, tiers = DEFAULT_FEE_TIERS, minFeeBps = DEFAULT_MIN_FEE_BPS) {
  let bps = tiers[tiers.length - 1]?.bps ?? minFeeBps;
  for (const tier2 of tiers) {
    if (tier2.maxAmountUsd === null || amountUsd < tier2.maxAmountUsd) {
      bps = tier2.bps;
      break;
    }
  }
  bps = Math.max(bps, minFeeBps);
  const percent = (bps / 100).toFixed(2);
  const tier = TIER_LABELS[bps] ?? "Custom";
  return { bps, percent, tier };
}

// src/utils/format.ts
function toAtomicAmount(amount, decimals) {
  const [whole = "0", frac = ""] = amount.split(".");
  const paddedFrac = frac.padEnd(decimals, "0").slice(0, decimals);
  const raw = whole + paddedFrac;
  return raw.replace(/^0+/, "") || "0";
}
function fromAtomicAmount(atomicAmount, decimals) {
  if (decimals === 0) return atomicAmount;
  const padded = atomicAmount.padStart(decimals + 1, "0");
  const wholeEnd = padded.length - decimals;
  const whole = padded.slice(0, wholeEnd);
  const frac = padded.slice(wholeEnd).replace(/0+$/, "");
  if (!frac) return whole;
  return `${whole}.${frac}`;
}
function truncateAddress(address, startChars = 6, endChars = 4) {
  if (address.length <= startChars + endChars + 3) return address;
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}
function formatUsd(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

// src/quotes/get-quote.ts
async function getQuote(request, apiClient, mapper, options) {
  return executeQuoteRequest(request, true, apiClient, mapper, options);
}
async function executeQuoteRequest(request, dry, apiClient, mapper, options) {
  const fromAssetId = `${request.from.chain}:${request.from.token.toLowerCase()}`;
  const toAssetId = `${request.to.chain}:${request.to.token.toLowerCase()}`;
  const fromProtocol = mapper.resolveToProtocol(fromAssetId);
  if (!fromProtocol) {
    throw new GoBlinkAssetNotFoundError(fromAssetId);
  }
  const toProtocol = mapper.resolveToProtocol(toAssetId);
  if (!toProtocol) {
    throw new GoBlinkAssetNotFoundError(toAssetId);
  }
  const fromToken = mapper.findToken(request.from.chain, request.from.token);
  const toToken = mapper.findToken(request.to.chain, request.to.token);
  if (!fromToken) {
    throw new GoBlinkAssetNotFoundError(fromAssetId);
  }
  if (!toToken) {
    throw new GoBlinkAssetNotFoundError(toAssetId);
  }
  if (!request.amount || parseFloat(request.amount) <= 0) {
    throw new GoBlinkValidationError("Amount must be greater than 0", "amount");
  }
  const atomicAmount = toAtomicAmount(request.amount, fromToken.decimals);
  const fee = calculateFee(parseFloat(request.amount), options.feeTiers, options.minFeeBps);
  const deadline = new Date(Date.now() + 15 * 60 * 1e3).toISOString();
  const protocolRequest = {
    dry,
    originAsset: fromProtocol,
    destinationAsset: toProtocol,
    amount: atomicAmount,
    recipient: request.recipient,
    refundTo: request.refundAddress,
    swapType: "EXACT_INPUT",
    slippageTolerance: request.slippage ?? 100,
    deadline,
    depositType: "ORIGIN_CHAIN",
    recipientType: "DESTINATION_CHAIN",
    refundType: "ORIGIN_CHAIN",
    appFees: [{ recipient: options.feeRecipient, fee: fee.bps }]
  };
  const protocolResponse = await apiClient.postQuote(protocolRequest);
  const amountIn = fromAtomicAmount(protocolResponse.originAmount, fromToken.decimals);
  const amountOut = fromAtomicAmount(protocolResponse.destinationAmount, toToken.decimals);
  const amountInNum = parseFloat(amountIn);
  const amountOutNum = parseFloat(amountOut);
  const rate = amountInNum > 0 ? (amountOutNum / amountInNum).toFixed(6) : "0";
  const estimatedTime = protocolResponse.estimatedProcessingTimeMs ? Math.ceil(protocolResponse.estimatedProcessingTimeMs / 1e3) : 120;
  return {
    quoteId: protocolResponse.quoteId,
    depositAddress: protocolResponse.depositAddress,
    amountIn,
    amountOut,
    fee,
    rate,
    estimatedTime,
    expiresAt: protocolResponse.deadline
  };
}

// src/transfers/create.ts
async function createTransfer(request, apiClient, mapper, options) {
  const quoteResponse = await executeQuoteRequest(
    {
      from: request.from,
      to: request.to,
      amount: request.amount,
      recipient: request.recipient,
      refundAddress: request.refundAddress,
      slippage: request.slippage
    },
    false,
    // dry = false → real transfer
    apiClient,
    mapper,
    options
  );
  return {
    id: quoteResponse.quoteId,
    depositAddress: quoteResponse.depositAddress,
    depositAmount: quoteResponse.amountIn,
    expiresAt: quoteResponse.expiresAt
  };
}

// src/chains/config.ts
var chains = {
  ethereum: {
    id: "ethereum",
    name: "Ethereum",
    type: "evm",
    chainId: 1,
    explorer: "https://etherscan.io",
    explorerTxPath: "/tx/{hash}",
    nativeToken: "ETH"
  },
  base: {
    id: "base",
    name: "Base",
    type: "evm",
    chainId: 8453,
    explorer: "https://basescan.org",
    explorerTxPath: "/tx/{hash}",
    nativeToken: "ETH"
  },
  arbitrum: {
    id: "arbitrum",
    name: "Arbitrum",
    type: "evm",
    chainId: 42161,
    explorer: "https://arbiscan.io",
    explorerTxPath: "/tx/{hash}",
    nativeToken: "ETH"
  },
  bnb: {
    id: "bnb",
    name: "BNB Chain",
    type: "evm",
    chainId: 56,
    explorer: "https://bscscan.com",
    explorerTxPath: "/tx/{hash}",
    nativeToken: "BNB"
  },
  polygon: {
    id: "polygon",
    name: "Polygon",
    type: "evm",
    chainId: 137,
    explorer: "https://polygonscan.com",
    explorerTxPath: "/tx/{hash}",
    nativeToken: "POL"
  },
  optimism: {
    id: "optimism",
    name: "Optimism",
    type: "evm",
    chainId: 10,
    explorer: "https://optimistic.etherscan.io",
    explorerTxPath: "/tx/{hash}",
    nativeToken: "ETH"
  },
  avalanche: {
    id: "avalanche",
    name: "Avalanche",
    type: "evm",
    chainId: 43114,
    explorer: "https://snowtrace.io",
    explorerTxPath: "/tx/{hash}",
    nativeToken: "AVAX"
  },
  gnosis: {
    id: "gnosis",
    name: "Gnosis",
    type: "evm",
    chainId: 100,
    explorer: "https://gnosisscan.io",
    explorerTxPath: "/tx/{hash}",
    nativeToken: "xDAI"
  },
  berachain: {
    id: "berachain",
    name: "Berachain",
    type: "evm",
    chainId: 80094,
    explorer: "https://berascan.com",
    explorerTxPath: "/tx/{hash}",
    nativeToken: "BERA"
  },
  monad: {
    id: "monad",
    name: "Monad",
    type: "evm",
    chainId: 143,
    explorer: "https://explorer.monad.xyz",
    explorerTxPath: "/tx/{hash}",
    nativeToken: "MON"
  },
  aurora: {
    id: "aurora",
    name: "Aurora",
    type: "evm",
    chainId: 1313161554,
    explorer: "https://explorer.aurora.dev",
    explorerTxPath: "/tx/{hash}",
    nativeToken: "ETH"
  },
  xlayer: {
    id: "xlayer",
    name: "X Layer",
    type: "evm",
    chainId: 196,
    explorer: "https://www.oklink.com/xlayer",
    explorerTxPath: "/tx/{hash}",
    nativeToken: "OKB"
  },
  near: {
    id: "near",
    name: "NEAR",
    type: "account",
    explorer: "https://nearblocks.io",
    explorerTxPath: "/txns/{hash}",
    nativeToken: "NEAR"
  },
  solana: {
    id: "solana",
    name: "Solana",
    type: "account",
    explorer: "https://solscan.io",
    explorerTxPath: "/tx/{hash}",
    nativeToken: "SOL"
  },
  sui: {
    id: "sui",
    name: "Sui",
    type: "move",
    explorer: "https://suiscan.xyz",
    explorerTxPath: "/tx/{hash}",
    nativeToken: "SUI"
  },
  bitcoin: {
    id: "bitcoin",
    name: "Bitcoin",
    type: "utxo",
    explorer: "https://mempool.space",
    explorerTxPath: "/tx/{hash}",
    nativeToken: "BTC"
  },
  litecoin: {
    id: "litecoin",
    name: "Litecoin",
    type: "utxo",
    explorer: "https://litecoinspace.org",
    explorerTxPath: "/tx/{hash}",
    nativeToken: "LTC"
  },
  dogecoin: {
    id: "dogecoin",
    name: "Dogecoin",
    type: "utxo",
    explorer: "https://dogechain.info",
    explorerTxPath: "/tx/{hash}",
    nativeToken: "DOGE"
  },
  bitcoincash: {
    id: "bitcoincash",
    name: "Bitcoin Cash",
    type: "utxo",
    explorer: "https://blockchair.com/bitcoin-cash",
    explorerTxPath: "/transaction/{hash}",
    nativeToken: "BCH"
  },
  tron: {
    id: "tron",
    name: "Tron",
    type: "account",
    explorer: "https://tronscan.org",
    explorerTxPath: "/#/transaction/{hash}",
    nativeToken: "TRX"
  },
  ton: {
    id: "ton",
    name: "TON",
    type: "account",
    explorer: "https://tonscan.org",
    explorerTxPath: "/tx/{hash}",
    nativeToken: "TON"
  },
  stellar: {
    id: "stellar",
    name: "Stellar",
    type: "account",
    explorer: "https://stellarchain.io",
    explorerTxPath: "/tx/{hash}",
    nativeToken: "XLM"
  },
  xrp: {
    id: "xrp",
    name: "XRP Ledger",
    type: "account",
    explorer: "https://xrpscan.com",
    explorerTxPath: "/tx/{hash}",
    nativeToken: "XRP"
  },
  starknet: {
    id: "starknet",
    name: "Starknet",
    type: "account",
    explorer: "https://starkscan.co",
    explorerTxPath: "/tx/{hash}",
    nativeToken: "STRK"
  },
  cardano: {
    id: "cardano",
    name: "Cardano",
    type: "account",
    explorer: "https://cardanoscan.io",
    explorerTxPath: "/transaction/{hash}",
    nativeToken: "ADA"
  },
  aptos: {
    id: "aptos",
    name: "Aptos",
    type: "move",
    explorer: "https://aptoscan.com",
    explorerTxPath: "/transaction/{hash}",
    nativeToken: "APT"
  },
  aleo: {
    id: "aleo",
    name: "Aleo",
    type: "account",
    explorer: "https://aleoscan.io",
    explorerTxPath: "/transaction/{hash}",
    nativeToken: "ALEO"
  }
};
function getAllChains() {
  return Object.values(chains);
}

// src/transfers/status.ts
var STATUS_MAP = {
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  COMPLETED: "SUCCESS",
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
  EXPIRED: "EXPIRED",
  REFUNDED: "REFUNDED"
};
async function getTransferStatus(depositAddress, apiClient, destinationChain) {
  const result = await apiClient.getExecutionStatus(depositAddress);
  const status = STATUS_MAP[result.status.toUpperCase()] ?? "PROCESSING";
  let explorerUrl;
  if (result.txHash && destinationChain) ;
  return {
    status,
    txHash: result.txHash,
    explorerUrl
  };
}

// src/validation/address.ts
var ADDRESS_PATTERNS = {
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
    /^([a-z0-9_-]+\.)*[a-z0-9_-]+$/,
    // named account (2-64 chars)
    /^[a-f0-9]{64}$/
    // implicit account
  ],
  bitcoin: [/^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/],
  tron: [/^T[1-9A-HJ-NP-Za-km-z]{33}$/],
  ton: [/^(EQ|UQ)[a-zA-Z0-9_-]{46}$/],
  stellar: [/^G[A-Z2-7]{55}$/],
  xrp: [/^r[1-9A-HJ-NP-Za-km-z]{24,34}$/],
  starknet: [/^0x[a-fA-F0-9]{1,64}$/],
  aptos: [/^0x[a-fA-F0-9]{1,64}$/]
};
function validateAddress(chain, address) {
  const patterns = ADDRESS_PATTERNS[chain];
  if (!patterns) return true;
  if (chain === "near") {
    if (/^[a-f0-9]{64}$/.test(address)) return true;
    if (address.length >= 2 && address.length <= 64 && /^([a-z0-9_-]+\.)*[a-z0-9_-]+$/.test(address)) return true;
    return false;
  }
  return patterns.some((pattern) => pattern.test(address));
}

// src/client.ts
var GoBlink = class {
  apiClient;
  mapper;
  tokenList;
  feeTiers;
  minFeeBps;
  feeRecipient;
  constructor(options = {}) {
    this.apiClient = new ApiClient({
      baseUrl: options.baseUrl,
      timeout: options.timeout
    });
    this.mapper = new AssetMapper();
    this.tokenList = new TokenListProvider(
      this.apiClient,
      this.mapper,
      options.cacheTtl
    );
    this.feeTiers = options.fees ?? DEFAULT_FEE_TIERS;
    this.minFeeBps = options.minFee ?? DEFAULT_MIN_FEE_BPS;
    this.feeRecipient = options.feeRecipient ?? "goblink.near";
  }
  /**
   * Get all supported tokens, optionally filtered by chain or search query.
   * Results are cached for the configured TTL.
   *
   * @param options - Filter options
   * @returns Array of supported tokens
   */
  async getTokens(options) {
    const tokens = await this.tokenList.getTokens();
    return options ? filterTokens(tokens, options) : tokens;
  }
  /**
   * Get a quote for a cross-chain transfer.
   * This is a dry run — no funds are committed.
   *
   * @param request - Quote request parameters
   * @returns Quote with deposit address, amounts, fee, and estimated time
   */
  async getQuote(request) {
    await this.tokenList.ensureInitialized();
    return getQuote(request, this.apiClient, this.mapper, {
      feeRecipient: this.feeRecipient,
      feeTiers: this.feeTiers,
      minFeeBps: this.minFeeBps
    });
  }
  /**
   * Create a real cross-chain transfer.
   * After calling this, send the exact deposit amount to the returned deposit address.
   *
   * @param request - Transfer request parameters
   * @returns Transfer details including deposit address
   */
  async createTransfer(request) {
    await this.tokenList.ensureInitialized();
    return createTransfer(request, this.apiClient, this.mapper, {
      feeRecipient: this.feeRecipient,
      feeTiers: this.feeTiers,
      minFeeBps: this.minFeeBps
    });
  }
  /**
   * Check the status of a transfer by its deposit address.
   *
   * @param depositAddress - The deposit address returned from createTransfer
   * @returns Current transfer status
   */
  async getTransferStatus(depositAddress) {
    return getTransferStatus(depositAddress, this.apiClient);
  }
  /**
   * Validate an address for a specific chain.
   *
   * @param chain - Chain identifier
   * @param address - Address to validate
   * @returns true if the address is valid
   */
  validateAddress(chain, address) {
    return validateAddress(chain, address);
  }
  /**
   * Get all supported chains with their configurations.
   *
   * @returns Array of chain configurations
   */
  getChains() {
    return getAllChains();
  }
  /**
   * Calculate the fee for a given USD amount.
   *
   * @param amountUsd - Transaction amount in USD
   * @returns Fee information including BPS, percentage, and tier
   */
  calculateFee(amountUsd) {
    return calculateFee(amountUsd, this.feeTiers, this.minFeeBps);
  }
  /**
   * Clear the cached token list, forcing a fresh fetch on next call.
   */
  clearCache() {
    this.tokenList.clearCache();
  }
};

exports.GoBlink = GoBlink;
exports.GoBlinkApiError = GoBlinkApiError;
exports.GoBlinkAssetNotFoundError = GoBlinkAssetNotFoundError;
exports.GoBlinkError = GoBlinkError;
exports.GoBlinkNetworkError = GoBlinkNetworkError;
exports.GoBlinkValidationError = GoBlinkValidationError;
exports.formatUsd = formatUsd;
exports.fromAtomicAmount = fromAtomicAmount;
exports.toAtomicAmount = toAtomicAmount;
exports.truncateAddress = truncateAddress;
exports.validateAddress = validateAddress;
//# sourceMappingURL=index.cjs.map
//# sourceMappingURL=index.cjs.map