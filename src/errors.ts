/** Base error class for all goBlink SDK errors */
export class GoBlinkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GoBlinkError';
  }
}

/** Error from the upstream API (non-2xx response) */
export class GoBlinkApiError extends GoBlinkError {
  readonly statusCode: number;
  readonly responseBody: string | undefined;
  readonly url: string;

  constructor(statusCode: number, responseBody: string | undefined, url: string) {
    super(`API request failed with status ${statusCode}`);
    this.name = 'GoBlinkApiError';
    this.statusCode = statusCode;
    this.responseBody = responseBody;
    this.url = url;
  }
}

/** Network-level error (timeout, DNS failure, etc.) */
export class GoBlinkNetworkError extends GoBlinkError {
  readonly url: string;

  constructor(message: string, url: string) {
    super(message);
    this.name = 'GoBlinkNetworkError';
    this.url = url;
  }
}

/** Validation error (invalid address, amount, etc.) */
export class GoBlinkValidationError extends GoBlinkError {
  readonly field: string;

  constructor(message: string, field: string) {
    super(message);
    this.name = 'GoBlinkValidationError';
    this.field = field;
  }
}

/** Asset not found error */
export class GoBlinkAssetNotFoundError extends GoBlinkError {
  readonly assetId: string;

  constructor(assetId: string) {
    super(`Asset not found: ${assetId}`);
    this.name = 'GoBlinkAssetNotFoundError';
    this.assetId = assetId;
  }
}
