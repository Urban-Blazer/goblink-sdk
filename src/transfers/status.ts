import type { ApiClient } from '../internal/api-client.js';
import type { TransferStatus, TransferStatusValue } from './types.js';
import type { ChainId } from '../chains/types.js';
import { getExplorerTxUrl } from '../chains/config.js';

/** Known status values from the upstream API */
const STATUS_MAP: Record<string, TransferStatusValue> = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'SUCCESS',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  EXPIRED: 'EXPIRED',
  REFUNDED: 'REFUNDED',
};

/**
 * Get the current status of a transfer by its deposit address
 */
export async function getTransferStatus(
  depositAddress: string,
  apiClient: ApiClient,
  destinationChain?: ChainId,
): Promise<TransferStatus> {
  const result = await apiClient.getExecutionStatus(depositAddress);

  const status: TransferStatusValue = STATUS_MAP[result.status.toUpperCase()] ?? 'PROCESSING';

  let explorerUrl: string | undefined;
  if (result.txHash && destinationChain) {
    explorerUrl = getExplorerTxUrl(destinationChain, result.txHash);
  }

  return {
    status,
    txHash: result.txHash,
    explorerUrl,
  };
}
