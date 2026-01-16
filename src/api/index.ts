import { RefreshResponse } from '@/api/auth/entity';
import { useAuthStore } from '@/stores/auth';
import { redirectToLogin } from '@/utils/ts/auth';

const BASE_URL = import.meta.env.VITE_API_PATH;

if (!BASE_URL) {
  throw new Error('API 경로 환경변수가 설정되지 않았습니다.');
}

type QueryAtom = string | number | boolean;
type QueryParamValue = QueryAtom | QueryAtom[];

interface FetchOptions<P extends object = Record<string, QueryParamValue>> extends Omit<RequestInit, 'body'> {
  headers?: Record<string, string>;
  body?: unknown;
  params?: P;
  skipAuth?: boolean;
  skipRefresh?: boolean;
}

let refreshPromise: Promise<string | null> | null = null;

export const apiClient = {
  get: <T = unknown, P extends object = Record<string, QueryParamValue>>(
    endPoint: string,
    options: FetchOptions<P> = {},
  ) => sendRequest<T, P>(endPoint, { ...options, method: 'GET' }),
  post: <T = unknown, P extends object = Record<string, QueryParamValue>>(
    endPoint: string,
    options: FetchOptions<P> = {},
  ) => sendRequest<T, P>(endPoint, { ...options, method: 'POST' }),
  put: <T = unknown, P extends object = Record<string, QueryParamValue>>(
    endPoint: string,
    options: FetchOptions<P> = {},
  ) => sendRequest<T, P>(endPoint, { ...options, method: 'PUT' }),
  delete: <T = unknown, P extends object = Record<string, QueryParamValue>>(
    endPoint: string,
    options: FetchOptions<P> = {},
  ) => sendRequest<T, P>(endPoint, { ...options, method: 'DELETE' }),
  patch: <T = unknown, P extends object = Record<string, QueryParamValue>>(
    endPoint: string,
    options: FetchOptions<P> = {},
  ) => sendRequest<T, P>(endPoint, { ...options, method: 'PATCH' }),
};

function joinUrl(baseUrl: string, path: string) {
  const base = baseUrl.replace(/\/+$/, '');
  const p = path.replace(/^\/+/, '');
  return `${base}/${p}`;
}

function buildQuery(params: Record<string, QueryParamValue>) {
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value == null) continue;
    if (Array.isArray(value)) {
      if (value.length === 0) continue;
      for (const v of value) {
        if (v == null) continue;
        usp.append(key, String(v));
      }
    } else {
      usp.append(key, String(value));
    }
  }
  return usp.toString();
}

async function sendRequest<T = unknown, P extends object = Record<string, QueryParamValue>>(
  endPoint: string,
  options: FetchOptions<P> = {},
  timeout: number = 10000,
): Promise<T> {
  const { headers, body, method, params, skipAuth, skipRefresh, ...restOptions } = options;

  if (!method) {
    throw new Error('HTTP method가 설정되지 않았습니다.');
  }

  const token = !skipAuth
    ? useAuthStore.getState().accessToken
    : null;

  let url = joinUrl(BASE_URL, endPoint);
  if (params && Object.keys(params).length > 0) {
    const query = buildQuery(params as Record<string, QueryParamValue>);
    if (query) url += `?${query}`;
  }

  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), timeout);

  const isJsonBody = body !== undefined && body !== null && !(body instanceof FormData);

  try {
    const fetchOptions: RequestInit = {
      headers: {
        ...(isJsonBody ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      method,
      signal: abortController.signal,
      credentials: restOptions.credentials ?? 'include',
      ...restOptions,
    };

    if (body !== undefined && body !== null && !['GET', 'HEAD'].includes(method)) {
      fetchOptions.body =
        typeof body === 'object' && !(body instanceof Blob) && !(body instanceof FormData)
          ? JSON.stringify(body)
          : (body as BodyInit);
    }

    const response = await fetch(url, fetchOptions);

    if (response.status === 401 && !skipAuth && !skipRefresh) {
      const refreshedToken = await refreshAccessToken();
      if (refreshedToken) {
        return sendRequest<T, P>(endPoint, { ...options, skipRefresh: true }, timeout);
      }
    }

    if (!response.ok) {
      const errorMessage = await parseResponseText(response);
      const error = new Error(errorMessage || 'API 요청 실패');
      Object.assign(error, {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
      });
      throw error;
    }

    return parseResponse<T>(response);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('요청 시간이 초과되었습니다.');
    }
    if (error instanceof TypeError && !skipAuth && !skipRefresh) {
      const { accessToken, refreshToken } = useAuthStore.getState();
      if (accessToken || refreshToken) {
        useAuthStore.getState().clearAccessToken();
        useAuthStore.getState().clearRefreshToken();
        redirectToLogin();
      }
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise;

  const refreshToken = useAuthStore.getState().refreshToken;
  if (!refreshToken) {
    useAuthStore.getState().clearAccessToken();
    useAuthStore.getState().clearRefreshToken();
    redirectToLogin();
    return null;
  }

  refreshPromise = (async () => {
    try {
      const response = await sendRequest<RefreshResponse>('/api/auth/refresh', {
        method: 'POST',
        skipAuth: true,
        skipRefresh: true,
        body: { refreshToken },
      });

      if (!response?.accessToken) {
        throw new Error('Missing access token in refresh response.');
      }

      useAuthStore.getState().setAccessToken(response.accessToken);
      if (response.refreshToken) {
        useAuthStore.getState().setRefreshToken(response.refreshToken);
      }
      return response.accessToken;
    } catch {
      useAuthStore.getState().clearAccessToken();
      useAuthStore.getState().clearRefreshToken();
      redirectToLogin();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function parseResponse<T = unknown>(response: Response): Promise<T> {
  const contentType = response.headers.get('Content-Type') || '';
  if (contentType.includes('application/json')) {
    try {
      return await response.json();
    } catch {
      return {} as T;
    }
  } else if (contentType.includes('text')) {
    return (await response.text()) as unknown as T;
  } else {
    return null as unknown as T;
  }
}

async function parseResponseText(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return '서버로부터 응답을 받지 못했습니다.';
  }
}
