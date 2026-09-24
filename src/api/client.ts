import axios, { AxiosInstance } from 'axios';
import { getStoredTokens, setStoredTokens, clearStoredTokens, AuthTokens } from '../auth/storage';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5000';

// Sem timeout, uma requisição para um IP errado/inacessível (comum no celular físico)
// fica pendurada indefinidamente com o loading girando.
export const REQUEST_TIMEOUT_MS = 15000;

export const apiClient: AxiosInstance = axios.create({ baseURL: API_BASE_URL, timeout: REQUEST_TIMEOUT_MS });

// Instância separada só para a chamada de refresh, pra não reentrar nos
// interceptors de `apiClient` (evita loop infinito em caso de falha).
export const refreshClient: AxiosInstance = axios.create({ baseURL: API_BASE_URL, timeout: REQUEST_TIMEOUT_MS });

// Rotas em que 401 significa credencial errada, não token expirado.
const NO_REFRESH_PATHS = ['/auth/login', '/auth/register', '/auth/refresh'];

let onRefreshFailure: (() => void) | null = null;

export function setOnRefreshFailure(handler: (() => void) | null) {
  onRefreshFailure = handler;
}

// O backend rotaciona o refresh token a cada uso: se duas requisições recebem 401 ao
// mesmo tempo e cada uma chama /auth/refresh, a segunda usa um token já invalidado e
// desloga o usuário. Por isso existe no máximo um refresh em andamento, compartilhado.
let refreshInFlight: Promise<AuthTokens> | null = null;

async function refreshTokens(refreshToken: string): Promise<AuthTokens> {
  const { data } = await refreshClient.post('/auth/refresh', { refresh_token: refreshToken });
  const newTokens: AuthTokens = {
    accessToken: data.data.access_token,
    refreshToken: data.data.refresh_token,
  };
  await setStoredTokens(newTokens);
  return newTokens;
}

function getSharedRefresh(refreshToken: string): Promise<AuthTokens> {
  if (!refreshInFlight) {
    refreshInFlight = refreshTokens(refreshToken).finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
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

    const isAuthRoute = NO_REFRESH_PATHS.some((path) => originalRequest?.url?.startsWith(path));
    if (error.response?.status !== 401 || !originalRequest || originalRequest._retry || isAuthRoute) {
      return Promise.reject(error);
    }
    originalRequest._retry = true;

    const tokens = await getStoredTokens();
    if (!tokens?.refreshToken) {
      await clearStoredTokens();
      onRefreshFailure?.();
      return Promise.reject(error);
    }

    // Outra requisição já renovou o token depois que esta foi enviada: só repete com o novo.
    const sentAuthorization = originalRequest.headers?.Authorization;
    if (tokens.accessToken && sentAuthorization && sentAuthorization !== `Bearer ${tokens.accessToken}`) {
      return apiClient(originalRequest);
    }

    try {
      const newTokens = await getSharedRefresh(tokens.refreshToken);
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
