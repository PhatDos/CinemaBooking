import { API_URL } from '@/src/config';

let accessToken: string | null = null;
let unauthorizedHandler: (() => void | Promise<void>) | null = null;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly data: unknown,
    public readonly method?: string,
    public readonly path?: string,
    public readonly url?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type ApiRequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  auth?: boolean;
};

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function setUnauthorizedHandler(handler: (() => void | Promise<void>) | null) {
  unauthorizedHandler = handler;
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { auth = true, body, headers: optionHeaders, ...requestOptions } = options;
  const headers = new Headers(optionHeaders);
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  const method = requestOptions.method?.toUpperCase() ?? 'GET';
  const url = toApiUrl(path);

  headers.set('Accept', 'application/json');

  if (body !== undefined && !isFormData) {
    headers.set('Content-Type', 'application/json');
  }

  if (auth && accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  let response: Response;

  try {
    response = await fetch(url, {
      ...requestOptions,
      headers,
      body: serializeBody(body, isFormData),
    });
  } catch (error) {
    throw new ApiError(
      `Cannot connect to backend for ${method} ${path}. Check Wi-Fi and API server.`,
      0,
      error,
      method,
      path,
      url,
    );
  }

  const data = await parseResponse(response);

  if (!response.ok) {
    if (auth && response.status === 401) {
      await unauthorizedHandler?.();
    }

    throw new ApiError(
      getErrorMessage(data, response.status, method, path),
      response.status,
      data,
      method,
      path,
      url,
    );
  }

  return data as T;
}

export const apiFetch = apiRequest;

export async function checkHealth(): Promise<string> {
  let response: Response;

  try {
    response = await fetch(toApiUrl('/health'));
  } catch (error) {
    throw new ApiError(
      'Cannot connect to backend. Check Wi-Fi and API server.',
      0,
      error,
      'GET',
      '/health',
      toApiUrl('/health'),
    );
  }

  if (!response.ok) {
    throw new Error(`Backend returned ${response.status}`);
  }

  return response.text();
}

function toApiUrl(path: string) {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  return `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

function serializeBody(body: unknown, isFormData: boolean) {
  if (body === undefined) {
    return undefined;
  }

  return isFormData ? (body as BodyInit) : JSON.stringify(body);
}

async function parseResponse(response: Response) {
  if (response.status === 204) {
    return undefined;
  }

  const text = await response.text();

  if (!text) {
    return undefined;
  }

  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    return JSON.parse(text);
  }

  return text;
}

function getErrorMessage(
  data: unknown,
  status: number,
  method: string,
  path: string,
) {
  if (isProblemDetails(data) && data.detail) {
    return data.detail;
  }

  if (isProblemDetails(data) && data.title) {
    return data.title;
  }

  return `Backend returned ${status} for ${method} ${path}`;
}

function isProblemDetails(data: unknown): data is { title?: string; detail?: string } {
  return typeof data === 'object' && data !== null;
}
