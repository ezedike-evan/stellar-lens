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