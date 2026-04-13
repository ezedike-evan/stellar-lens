interface RpcRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: unknown[];
}

interface RpcResponse<T> {
  jsonrpc: '2.0';
  id: string | number;
  result?: T;
  error?: RpcResponseErrorPayload;
}

interface RpcResponseErrorPayload {
  code: number;
  message: string;
  data?: unknown;
}

interface RpcClientConfig {
  url: string;
  timeout?: number;
}

export { RpcRequest, RpcResponse, RpcResponseErrorPayload, RpcClientConfig };
