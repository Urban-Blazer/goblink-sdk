// INTERNAL ONLY — these types must never be exported from the public API

/** Token as returned by the upstream swap API */
export interface ProtocolToken {
  defuseAssetId: string;
  chainName: string;
  chainId?: string;
  address?: string;
  symbol: string;
  name: string;
  decimals: number;
  icon?: string;
  routes?: string[];
}

/** Quote request shape sent to the upstream API */
export interface ProtocolQuoteRequest {
  dry: boolean;
  originAsset: string;
  destinationAsset: string;
  amount: string;
  recipient: string;
  refundTo: string;
  swapType: 'EXACT_INPUT' | 'EXACT_OUTPUT';
  slippageTolerance: number;
  deadline: string;
  depositType: 'ORIGIN_CHAIN';
  recipientType: 'DESTINATION_CHAIN';
  refundType: 'ORIGIN_CHAIN';
  appFees: ProtocolAppFee[];
}

/** App fee entry for the upstream API */
export interface ProtocolAppFee {
  recipient: string;
  fee: number;
}

/** Quote response from the upstream API */
export interface ProtocolQuoteResponse {
  quoteId: string;
  depositAddress: string;
  originAmount: string;
  destinationAmount: string;
  deadline: string;
  estimatedProcessingTimeMs?: number;
}

/** Execution status from the upstream API */
export interface ProtocolExecutionStatus {
  status: string;
  txHash?: string;
  details?: string;
}
