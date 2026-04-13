export interface RpcRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: unknown[];
}

export interface RpcResponse<T> {
  jsonrpc: '2.0';
  id: string | number;
  result?: T;
  error?: RpcResponseErrorPayload;
}

export interface RpcResponseErrorPayload {
  code: number;
  message: string;
  data?: unknown;
}

export interface RpcClientConfig {
  url: string;
  timeout?: number;
}

export type EndpointStatus = 'healthy' | 'degraded' | 'unreachable';

export interface EndpointHealth {
  url: string;
  status: EndpointStatus;
  latencyMs: number | null;
  lastChecked: Date | null;
  consecutiveFailures: number;
}

export interface RouterConfig {
  endpoints: readonly string[];
  healthCheckIntervalMs?: number;
  maxRetries?: number;
  fallbackOnFailure?: boolean;
  timeout?: number;
}

export interface RouterState {
  endpoints: EndpointHealth[];
  activeIndex: number;
}
