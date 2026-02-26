// INTERNAL ONLY — HTTP client for the underlying swap API

import type {
  RawProtocolToken,
  ProtocolToken,
  ProtocolQuoteRequest,
  ProtocolQuoteResponse,
  ProtocolExecutionStatus,
} from './types.js';
import { GoBlinkApiError, GoBlinkNetworkError } from '../errors.js';

const DEFAULT_BASE_URL = 'https://1click.chaindefuser.com';

export interface ApiClientOptions {
  baseUrl?: string;
  timeout?: number;
}

export class ApiClient {
  private readonly baseUrl: string;
  private readonly timeout: number;

  constructor(options: ApiClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
    this.timeout = options.timeout ?? 30_000;
  }

  /** Fetch all supported tokens */
  async getTokens(): Promise<ProtocolToken[]> {
    const raw = await this.get<RawProtocolToken[]>('/v0/tokens');
    return raw
      .filter((t) => t.blockchain && t.symbol)
      .map((t) => ({
        defuseAssetId: t.assetId,
        chainName: t.blockchain,
        address: t.contractAddress,
        symbol: t.symbol,
        name: t.symbol,
        decimals: t.decimals,
        price: t.price,
      }));
  }

  /** Request a quote (dry=true) or create a transfer (dry=false) */
  async postQuote(request: ProtocolQuoteRequest): Promise<ProtocolQuoteResponse> {
    return this.post<ProtocolQuoteResponse>('/v0/quote', request);
  }

  /** Check the execution status of a transfer */
  async getExecutionStatus(depositAddress: string): Promise<ProtocolExecutionStatus> {
    return this.get<ProtocolExecutionStatus>(
      `/v0/execution-status/${encodeURIComponent(depositAddress)}`,
    );
  }

  private async get<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'GET' });
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  private async request<T>(path: string, init: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    let response: Response;
    try {
      response = await fetch(url, { ...init, signal: controller.signal });
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new GoBlinkNetworkError(`Request timed out after ${this.timeout}ms`, url);
      }
      throw new GoBlinkNetworkError(
        error instanceof Error ? error.message : 'Network request failed',
        url,
      );
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      let errorBody: string | undefined;
      try {
        errorBody = await response.text();
      } catch {
        // ignore
      }
      throw new GoBlinkApiError(response.status, errorBody, url);
    }

    return response.json() as Promise<T>;
  }
}
