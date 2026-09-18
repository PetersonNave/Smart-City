import axios, { AxiosInstance } from 'axios';
import { getStoredTokens, setStoredTokens, clearStoredTokens, AuthTokens } from '../auth/storage';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5000';

export const apiClient: AxiosInstance = axios.create({ baseURL: API_BASE_URL });

// Instância separada só para a chamada de refresh, pra não reentrar nos
// interceptors de `apiClient` (evita loop infinito em caso de falha).
export const refreshClient: AxiosInstance = axios.create({ baseURL: API_BASE_URL });

let onRefreshFailure: (() => void) | null = null;

export function setOnRefreshFailure(handler: (() => void) | null) {
  onRefreshFailure = handler;
}

apiClient.interceptors.request.use(async (config) => {
  const tokens = await getStoredTokens();
  if (tokens?.accessToken) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${tokens.accessToken}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as (typeof error.config) & { _retry?: boolean };

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }
    originalRequest._retry = true;

    const tokens = await getStoredTokens();
    if (!tokens?.refreshToken) {
      await clearStoredTokens();
      onRefreshFailure?.();
      return Promise.reject(error);
    }

    try {
      const { data } = await refreshClient.post('/auth/refresh', {
        refresh_token: tokens.refreshToken,
      });
      const newTokens: AuthTokens = {
        accessToken: data.data.access_token,
        refreshToken: data.data.refresh_token,
      };
      await setStoredTokens(newTokens);
      originalRequest.headers = originalRequest.headers ?? {};
      originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      await clearStoredTokens();
      onRefreshFailure?.();
      return Promise.reject(refreshError);
    }
  }
);
