import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { createBlocksApi, createCategoriesApi } from '@tymblok/api-client';
import type { ApiClient } from '@tymblok/api-client';
import type { AuthManager } from './auth-manager';

/**
 * Creates an axios-based ApiClient compatible with @tymblok/api-client factories.
 * Handles JWT auth headers and token refresh via AuthManager.
 */
export function createIdeApiClient(baseUrl: string, authManager: AuthManager): {
  client: ApiClient;
  blocks: ReturnType<typeof createBlocksApi>;
  categories: ReturnType<typeof createCategoriesApi>;
  axios: AxiosInstance;
} {
  const instance = axios.create({
    baseURL: baseUrl.replace(/\/$/, '') + '/api',
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
  });

  // Attach JWT to every request
  instance.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
    const token = await authManager.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Handle 401 with token refresh (single-inflight pattern)
  let refreshPromise: Promise<boolean> | null = null;

  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        if (!refreshPromise) {
          refreshPromise = authManager.refreshTokens().finally(() => {
            refreshPromise = null;
          });
        }

        const success = await refreshPromise;
        if (success) {
          const token = await authManager.getAccessToken();
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return instance(originalRequest);
        }

        // Refresh failed — force logout
        await authManager.logout();
      }
      return Promise.reject(error);
    }
  );

  // Implement the ApiClient interface expected by @tymblok/api-client
  const client: ApiClient = {
    async get<T>(endpoint: string, options?: Record<string, unknown>): Promise<T> {
      const response = await instance.get(endpoint, options);
      return response.data;
    },
    async post<T>(endpoint: string, body?: unknown, options?: Record<string, unknown>): Promise<T> {
      const response = await instance.post(endpoint, body, options);
      return response.data;
    },
    async patch<T>(endpoint: string, body?: unknown, options?: Record<string, unknown>): Promise<T> {
      const response = await instance.patch(endpoint, body, options);
      return response.data;
    },
    async delete<T>(endpoint: string, options?: Record<string, unknown>): Promise<T> {
      const response = await instance.delete(endpoint, options);
      return response.data;
    },
  };

  return {
    client,
    blocks: createBlocksApi(client),
    categories: createCategoriesApi(client),
    axios: instance,
  };
}
