export class RpcNetworkError extends Error {
  readonly url: string;

  constructor(message: string, url: string) {
    super(message);
    this.name = 'RpcNetworkError';
    this.url = url;
  }
}

export class RpcResponseError extends Error {
  readonly code: number;
  readonly data: unknown;

  constructor(message: string, code: number, data: unknown) {
    super(message);
    this.name = 'RpcResponseError';
    this.code = code;
    this.data = data;
  }
}

export class RpcTimeoutError extends Error {
  readonly url: string;
  readonly timeoutMs: number;

  constructor(message: string, url: string, timeoutMs: number) {
    super(message);
    this.name = 'RpcTimeoutError';
    this.url = url;
    this.timeoutMs = timeoutMs;
  }
}

export class RpcParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RpcParseError';
  }
}
