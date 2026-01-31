import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const authData = await SecureStore.getItemAsync('tymblok-auth');
    if (authData) {
      try {
        const { state } = JSON.parse(authData);
        if (state?.tokens?.accessToken) {
          config.headers.Authorization = `Bearer ${state.tokens.accessToken}`;
        }
      } catch {
        // Invalid stored data, ignore
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const authData = await SecureStore.getItemAsync('tymblok-auth');
        if (!authData) {
          throw new Error('No auth data');
        }

        const { state } = JSON.parse(authData);
        if (!state?.tokens?.refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await axios.post(`${API_URL}/api/auth/refresh`, {
          refreshToken: state.tokens.refreshToken,
        });

        const { accessToken, refreshToken, expiresIn } = response.data.data;

        // Update stored tokens
        const newState = {
          ...state,
          tokens: {
            accessToken,
            refreshToken,
            expiresIn,
          },
        };
        await SecureStore.setItemAsync('tymblok-auth', JSON.stringify({ state: newState }));

        processQueue(null, accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error, null);
        // Clear auth on refresh failure
        await SecureStore.deleteItemAsync('tymblok-auth');
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

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
