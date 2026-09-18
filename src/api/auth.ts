import axios from 'axios';
import { apiClient } from './client';

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

export type ApiFieldErrors = Record<string, string[]>;

type ApiEnvelope<T> = {
  data: T;
  message: string;
  status_code: number;
};

export class ApiValidationError extends Error {
  errors: ApiFieldErrors;
  constructor(message: string, errors: ApiFieldErrors) {
    super(message);
    this.errors = errors;
  }
}

function hasFieldErrors(data: unknown): data is { errors: ApiFieldErrors } {
  return typeof data === 'object' && data !== null && 'errors' in data;
}

async function unwrap<T>(promise: Promise<{ data: ApiEnvelope<T> }>): Promise<T> {
  try {
    const response = await promise;
    return response.data.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data) {
      const envelope = error.response.data as ApiEnvelope<unknown>;
      if (hasFieldErrors(envelope.data)) {
        throw new ApiValidationError(envelope.message, envelope.data.errors);
      }
      throw new Error(envelope.message || 'Erro inesperado ao comunicar com o servidor');
    }
    throw error;
  }
}

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
