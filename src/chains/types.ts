/** Supported chain identifiers */
export type ChainId =
  | 'ethereum'
  | 'base'
  | 'arbitrum'
  | 'bnb'
  | 'polygon'
  | 'optimism'
  | 'avalanche'
  | 'gnosis'
  | 'berachain'
  | 'monad'
  | 'aurora'
  | 'xlayer'
  | 'near'
  | 'solana'
  | 'sui'
  | 'bitcoin'
  | 'litecoin'
  | 'dogecoin'
  | 'bitcoincash'
  | 'tron'
  | 'ton'
  | 'stellar'
  | 'xrp'
  | 'starknet'
  | 'cardano'
  | 'aptos'
  | 'aleo';

/** Chain network type */
export type ChainType = 'evm' | 'utxo' | 'account' | 'move';

/** Chain configuration */
export interface ChainConfig {
  /** Unique chain identifier */
  id: ChainId;
  /** Human-readable chain name */
  name: string;
  /** Network type */
  type: ChainType;
  /** Numeric chain ID (EVM only) */
  chainId?: number;
  /** Block explorer base URL */
  explorer: string;
  /** Transaction path template (use {hash} placeholder) */
  explorerTxPath: string;
  /** Native token symbol */
  nativeToken: string;
}
