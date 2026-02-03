import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Android emulator uses 10.0.2.2 to reach host machine's localhost
const getDefaultApiUrl = () => {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000';
  }
  return 'http://localhost:5000';
};

export const API_URL = process.env.EXPO_PUBLIC_API_URL || getDefaultApiUrl();

// Log the API URL at startup for debugging
console.log('[API] Using API URL:', API_URL);
console.log('[API] Platform:', Platform.OS);
console.log('[API] Env var:', process.env.EXPO_PUBLIC_API_URL);

export interface ApiError {
  code: string;
  message: string;
}

export interface ApiResponse<T> {
  data: T;
  meta: {
    timestamp: string;
    requestId: string;
  };
}

export interface ApiErrorResponse {
  error: ApiError;
  meta: {
    timestamp: string;
    requestId: string;
  };
}

// Storage helpers for web compatibility
const getStorageItem = async (key: string): Promise<string | null> => {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
};

const setStorageItem = async (key: string, value: string): Promise<void> => {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
    return;
  }
  return SecureStore.setItemAsync(key, value);
};

const deleteStorageItem = async (key: string): Promise<void> => {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
    return;
  }
  return SecureStore.deleteItemAsync(key);
};

// Token refresh state
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function getAccessToken(): Promise<string | null> {
  const authData = await getStorageItem('tymblok-auth');
  if (!authData) {
    console.log('[API] getAccessToken: No auth data in storage');
    return null;
  }

  try {
    const parsed = JSON.parse(authData);
    const token = parsed?.state?.tokens?.access_token || null;
    console.log('[API] getAccessToken: Found auth data, token exists:', !!token);
    return token;
  } catch (err) {
    console.error('[API] getAccessToken: Failed to parse auth data:', err);
    return null;
  }
}

async function getRefreshToken(): Promise<string | null> {
  const authData = await getStorageItem('tymblok-auth');
  if (!authData) return null;

  try {
    const { state } = JSON.parse(authData);
    return state?.tokens?.refresh_token || null;
  } catch {
    return null;
  }
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    await deleteStorageItem('tymblok-auth');
    return null;
  }

  try {
    const response = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      await deleteStorageItem('tymblok-auth');
      return null;
    }

    const data = await response.json();
    const { accessToken, refreshToken: newRefreshToken, expiresIn } = data.data;

    // Update stored tokens
    const authData = await getStorageItem('tymblok-auth');
    if (authData) {
      const { state } = JSON.parse(authData);
      const newState = {
        ...state,
        tokens: {
          access_token: accessToken,
          refresh_token: newRefreshToken,
          expires_in: expiresIn,
          token_type: 'Bearer',
        },
      };
      await setStorageItem('tymblok-auth', JSON.stringify({ state: newState }));
    }

    return accessToken;
  } catch {
    await deleteStorageItem('tymblok-auth');
    return null;
  }
}

async function getValidAccessToken(): Promise<string | null> {
  // If already refreshing, wait for that to complete
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  return getAccessToken();
}

class FetchError extends Error {
  status: number;
  response?: ApiErrorResponse;

  constructor(message: string, status: number, response?: ApiErrorResponse) {
    super(message);
    this.name = 'FetchError';
    this.status = status;
    this.response = response;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  skipAuth?: boolean;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {}, skipAuth = false } = options;

  const url = `${API_URL}/api${endpoint}`;
  console.log(`[API] ${method} ${url}`);
  if (body) console.log('[API] Body:', JSON.stringify(body));

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  // Add auth token if not skipped
  if (!skipAuth) {
    const token = await getValidAccessToken();
    console.log(`[API] Token retrieved: ${token ? `${token.substring(0, 20)}...` : 'null'}`);
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    } else {
      console.warn('[API] No token available for authenticated request');
    }
  }

  const config: RequestInit = {
    method,
    headers: requestHeaders,
  };

  if (body && method !== 'GET') {
    config.body = JSON.stringify(body);
  }

  let response: Response;
  try {
    response = await fetch(url, config);
  } catch (err) {
    // Network error - no response from server
    console.error('[API] Network error:', err);
    throw new FetchError('Unable to connect. Please check your internet connection.', 0);
  }
  console.log(`[API] Response status: ${response.status}`);

  // Handle 401 - try to refresh token
  if (response.status === 401 && !skipAuth) {
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = refreshAccessToken();
    }

    const newToken = await refreshPromise;
    isRefreshing = false;
    refreshPromise = null;

    if (newToken) {
      requestHeaders['Authorization'] = `Bearer ${newToken}`;
      try {
        response = await fetch(`${API_URL}/api${endpoint}`, {
          ...config,
          headers: requestHeaders,
        });
      } catch (err) {
        console.error('[API] Network error on retry:', err);
        throw new FetchError('Unable to connect. Please check your internet connection.', 0);
      }
    } else {
      throw new FetchError('Session expired', 401);
    }
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    // Extract error message from different API response formats
    let errorMessage = 'Something went wrong. Please try again.';

    if (data?.error?.message) {
      // Our custom API error format: { error: { code, message } }
      errorMessage = data.error.message;
    } else if (data?.errors) {
      // .NET validation error format: { errors: { field: [messages] } }
      const firstField = Object.keys(data.errors)[0];
      if (firstField && data.errors[firstField]?.[0]) {
        errorMessage = data.errors[firstField][0];
      }
    } else if (data?.title) {
      // .NET ProblemDetails format: { title: "..." }
      errorMessage = data.title;
    }

    throw new FetchError(errorMessage, response.status, data);
  }

  return data;
}

export const api = {
  get: <T>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(endpoint, { ...options, method: 'POST', body }),

  put: <T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(endpoint, { ...options, method: 'PUT', body }),

  patch: <T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(endpoint, { ...options, method: 'PATCH', body }),

  delete: <T>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),
};
