// INTERNAL ONLY — Maps goBlink asset IDs ↔ protocol asset IDs

import type { ChainId } from '../chains/types.js';
import type { AssetId, Token } from '../tokens/types.js';
import type { ProtocolToken } from './types.js';
import { getTokenIcon } from '../tokens/icons.js';

/**
 * Map from protocol chain names to goBlink chain IDs.
 * The upstream API uses various chain name formats.
 */
const CHAIN_NAME_MAP: Record<string, ChainId | undefined> = {
  eth: 'ethereum',
  ethereum: 'ethereum',
  base: 'base',
  arbitrum: 'arbitrum',
  bsc: 'bnb',
  bnb: 'bnb',
  polygon: 'polygon',
  optimism: 'optimism',
  avalanche: 'avalanche',
  gnosis: 'gnosis',
  berachain: 'berachain',
  monad: 'monad',
  aurora: 'aurora',
  xlayer: 'xlayer',
  near: 'near',
  solana: 'solana',
  sol: 'solana',
  sui: 'sui',
  bitcoin: 'bitcoin',
  btc: 'bitcoin',
  litecoin: 'litecoin',
  ltc: 'litecoin',
  dogecoin: 'dogecoin',
  doge: 'dogecoin',
  bitcoincash: 'bitcoincash',
  bch: 'bitcoincash',
  tron: 'tron',
  trx: 'tron',
  ton: 'ton',
  stellar: 'stellar',
  xlm: 'stellar',
  xrp: 'xrp',
  starknet: 'starknet',
  cardano: 'cardano',
  ada: 'cardano',
  aptos: 'aptos',
  apt: 'aptos',
  aleo: 'aleo',
};

/** Bidirectional mapping between goBlink asset IDs and protocol asset IDs */
export class AssetMapper {
  /** goBlink asset ID → protocol asset ID (e.g., nep141:...) */
  private readonly toProtocol = new Map<AssetId, string>();
  /** protocol asset ID → goBlink asset ID */
  private readonly fromProtocol = new Map<string, AssetId>();
  /** goBlink asset ID → Token */
  private readonly tokenMap = new Map<AssetId, Token>();

  /**
   * Build the mapping from a list of protocol tokens.
   * Called after fetching the token list from the API.
   */
  buildFromProtocolTokens(protocolTokens: ProtocolToken[]): void {
    this.toProtocol.clear();
    this.fromProtocol.clear();
    this.tokenMap.clear();

    for (const pt of protocolTokens) {
      const chainId = resolveChainId(pt.chainName);
      if (!chainId) continue;

      const symbolLower = pt.symbol.toLowerCase();
      const assetId: AssetId = pt.address
        ? `${chainId}:${pt.address.toLowerCase()}`
        : `${chainId}:${symbolLower}`;

      // Also register a symbol-based lookup
      const symbolAssetId: AssetId = `${chainId}:${symbolLower}`;

      this.toProtocol.set(assetId, pt.defuseAssetId);
      this.fromProtocol.set(pt.defuseAssetId, assetId);

      // Register symbol alias if different from address-based ID
      if (assetId !== symbolAssetId) {
        this.toProtocol.set(symbolAssetId, pt.defuseAssetId);
      }

      const token: Token = {
        assetId,
        symbol: pt.symbol,
        name: pt.name,
        chain: chainId,
        decimals: pt.decimals,
        address: pt.address,
        icon: pt.icon ?? getTokenIcon(pt.symbol),
      };

      this.tokenMap.set(assetId, token);
    }
  }

  /** Resolve a goBlink asset ID to a protocol asset ID */
  resolveToProtocol(assetId: AssetId): string | undefined {
    return this.toProtocol.get(assetId);
  }

  /** Resolve a protocol asset ID to a goBlink asset ID */
  resolveFromProtocol(protocolId: string): AssetId | undefined {
    return this.fromProtocol.get(protocolId);
  }

  /** Get all mapped tokens */
  getAllTokens(): Token[] {
    return Array.from(this.tokenMap.values());
  }

  /** Get a token by its goBlink asset ID */
  getToken(assetId: AssetId): Token | undefined {
    return this.tokenMap.get(assetId);
  }

  /** Find a token by chain and symbol (case-insensitive) */
  findToken(chain: ChainId, symbol: string): Token | undefined {
    const key: AssetId = `${chain}:${symbol.toLowerCase()}`;
    const protocolId = this.toProtocol.get(key);
    if (!protocolId) return undefined;
    const canonicalId = this.fromProtocol.get(protocolId);
    if (!canonicalId) return undefined;
    return this.tokenMap.get(canonicalId);
  }
}

function resolveChainId(chainName: string): ChainId | undefined {
  return CHAIN_NAME_MAP[chainName.toLowerCase()];
}
