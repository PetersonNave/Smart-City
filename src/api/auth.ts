import { apiClient } from './client';
import { unwrap, type ApiEnvelope } from './envelope';

export { ApiValidationError, type ApiFieldErrors } from './envelope';

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
};

export type AuthTokensResponse = {
  access_token: string;
  refresh_token: string;
};

export type LoginResponse = AuthTokensResponse & { user: AuthUser };

export function register(input: {
  username: string;
  email: string;
  password: string;
}): Promise<AuthUser> {
  return unwrap(apiClient.post<ApiEnvelope<AuthUser>>('/auth/register', input));
}

export function login(input: { email: string; password: string }): Promise<LoginResponse> {
  return unwrap(apiClient.post<ApiEnvelope<LoginResponse>>('/auth/login', input));
}

export function refreshToken(refresh_token: string): Promise<AuthTokensResponse> {
  return unwrap(apiClient.post<ApiEnvelope<AuthTokensResponse>>('/auth/refresh', { refresh_token }));
}

export function getMe(): Promise<AuthUser> {
  return unwrap(apiClient.get<ApiEnvelope<AuthUser>>('/auth/me'));
}

export function logout(): Promise<null> {
  return unwrap(apiClient.get<ApiEnvelope<null>>('/auth/logout'));
}
