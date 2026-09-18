# Cadastro + Auth + App Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the registration screen, a full login/register/refresh-token auth flow with global state, a loading screen, and the post-login tab-navigator shell, using reusable/validated components.

**Architecture:** A small dependency-ordered stack of modules — SecureStore-backed token storage → Axios client with auth interceptors → typed API calls → `AuthContext` state machine (`bootstrapping | guest | authenticated`) — feeds a React Navigation tree (`RootNavigator` picks Loading / AuthStack / AppTabs by status). UI is built from reusable components (`Icon`, `Loading`, `Button`, `GradientBackground`, `TextField`) consumed by the screens.

**Tech Stack:** Expo SDK 54, React Navigation (native-stack + bottom-tabs), Axios, expo-secure-store, react-hook-form + zod, react-native-reanimated, expo-linear-gradient, lucide-react-native + react-native-svg, Jest (`jest-expo`) + `@testing-library/react-native`.

**Spec:** `docs/superpowers/specs/2026-09-18-cadastro-auth-design.md`

## Global Constraints

- API base URL comes from `EXPO_PUBLIC_API_URL` (documented in README already); default to `http://localhost:5000` when unset.
- Backend envelope is always `{ data, message, status_code }`. Validation errors: `data = { errors: { field: [messages] } }`.
- `POST /auth/register` body is `{ username, email, password }` only — `role` is server-forced, never send it.
- Registered/logged-in user's display name comes back as `data.name` (not `username`) — `UserResponseSchema.name = fields.Str(attribute='username')`.
- Every new file that has logic (not a pure placeholder) gets a co-located `*.test.ts`/`*.test.tsx`.
- Use the project's existing theme (`src/theme` — `colors`, `fonts`) for every hardcoded color/font in new UI code; don't introduce new brand colors.
- Commit after every task (see each task's final step). Author stays whatever the local git config already is — do not add co-author trailers.

---

## Task 1: Testing infrastructure

**Files:**
- Modify: `package.json`
- Create: `App.test.tsx`

**Interfaces:**
- Produces: a working `npm test` (Jest + `jest-expo` + `@testing-library/react-native`) that every later task's tests run under.

- [ ] **Step 1: Install test dependencies**

```bash
npx expo install jest-expo jest react-test-renderer --dev
npm install --save-dev @testing-library/react-native @types/jest
```

- [ ] **Step 2: Configure Jest in `package.json`**

Add to `package.json` (top level, alongside `"scripts"`):

```json
"scripts": {
  "start": "expo start",
  "android": "expo start --android",
  "ios": "expo start --ios",
  "web": "expo start --web",
  "test": "jest"
},
"jest": {
  "preset": "jest-expo"
}
```

- [ ] **Step 3: Write the smoke test**

```tsx
// App.test.tsx
import { render } from '@testing-library/react-native';

jest.mock('expo-font', () => ({
  useFonts: () => [true, null],
}));

import App from './App';

describe('App', () => {
  it('renders without crashing once fonts are loaded', () => {
    expect(() => render(<App />)).not.toThrow();
  });
});
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test`
Expected: 1 passed (this is a smoke test on the current scaffold, not TDD-first — the app already exists).

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json App.test.tsx
git commit -m "Add Jest + React Native Testing Library test infrastructure"
```

---

## Task 2: Secure token storage

**Files:**
- Create: `src/auth/storage.ts`
- Test: `src/auth/storage.test.ts`

**Interfaces:**
- Produces: `AuthTokens = { accessToken: string; refreshToken: string }`, `getStoredTokens(): Promise<AuthTokens | null>`, `setStoredTokens(tokens: AuthTokens): Promise<void>`, `clearStoredTokens(): Promise<void>`.

- [ ] **Step 1: Install expo-secure-store**

```bash
npx expo install expo-secure-store
```

- [ ] **Step 2: Write the failing test**

```ts
// src/auth/storage.test.ts
import * as SecureStore from 'expo-secure-store';
import { getStoredTokens, setStoredTokens, clearStoredTokens } from './storage';

jest.mock('expo-secure-store');

describe('storage', () => {
  afterEach(() => jest.clearAllMocks());

  it('returns null when nothing is stored', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
    expect(await getStoredTokens()).toBeNull();
  });

  it('parses the stored JSON tokens', async () => {
    const tokens = { accessToken: 'a', refreshToken: 'b' };
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(JSON.stringify(tokens));
    expect(await getStoredTokens()).toEqual(tokens);
  });

  it('stores tokens as JSON under the expected key', async () => {
    const tokens = { accessToken: 'a', refreshToken: 'b' };
    await setStoredTokens(tokens);
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'resolveai.auth.tokens',
      JSON.stringify(tokens)
    );
  });

  it('deletes the stored key on clear', async () => {
    await clearStoredTokens();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('resolveai.auth.tokens');
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- storage.test.ts`
Expected: FAIL — cannot find module `./storage`.

- [ ] **Step 4: Implement**

```ts
// src/auth/storage.ts
import * as SecureStore from 'expo-secure-store';

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

const STORAGE_KEY = 'resolveai.auth.tokens';

export async function getStoredTokens(): Promise<AuthTokens | null> {
  const raw = await SecureStore.getItemAsync(STORAGE_KEY);
  if (!raw) return null;
  return JSON.parse(raw) as AuthTokens;
}

export async function setStoredTokens(tokens: AuthTokens): Promise<void> {
  await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(tokens));
}

export async function clearStoredTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(STORAGE_KEY);
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- storage.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/auth/storage.ts src/auth/storage.test.ts
git commit -m "Add SecureStore-backed auth token storage"
```

---

## Task 3: Axios API client with auth interceptors

**Files:**
- Create: `src/api/client.ts`
- Test: `src/api/client.test.ts`
- Create: `.env.example`
- Create: `.env` (local only, not committed)
- Modify: `.gitignore`

**Interfaces:**
- Consumes: `getStoredTokens`, `setStoredTokens`, `clearStoredTokens` from `../auth/storage` (Task 2).
- Produces: `API_BASE_URL: string`, `apiClient: AxiosInstance`, `setOnRefreshFailure(handler: (() => void) | null): void`.

- [ ] **Step 1: Install axios and the test-only mock adapter**

```bash
npm install axios
npm install --save-dev axios-mock-adapter
```

- [ ] **Step 2: Add the env var files**

```
# .env.example
EXPO_PUBLIC_API_URL=http://localhost:5000
```

Create `.env` locally with the same content (this file must NOT be committed).

Add to `.gitignore`, right under the existing `.env*.local` line:

```
.env
```

- [ ] **Step 3: Write the failing test**

```ts
// src/api/client.test.ts
import MockAdapter from 'axios-mock-adapter';
import { apiClient, setOnRefreshFailure } from './client';
import { getStoredTokens, setStoredTokens, clearStoredTokens } from '../auth/storage';

jest.mock('../auth/storage');

describe('apiClient', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(apiClient);
    jest.clearAllMocks();
  });

  afterEach(() => {
    mock.restore();
  });

  it('attaches the stored access token as a Bearer header', async () => {
    (getStoredTokens as jest.Mock).mockResolvedValue({
      accessToken: 'access-123',
      refreshToken: 'refresh-456',
    });
    mock.onGet('/auth/me').reply((config) => {
      expect(config.headers?.Authorization).toBe('Bearer access-123');
      return [200, { data: { id: 1 }, message: '', status_code: 200 }];
    });

    await apiClient.get('/auth/me');
  });

  it('refreshes the token once on 401 and retries the original request', async () => {
    (getStoredTokens as jest.Mock).mockResolvedValue({
      accessToken: 'expired-access',
      refreshToken: 'refresh-456',
    });

    let callCount = 0;
    mock.onGet('/auth/me').reply(() => {
      callCount += 1;
      if (callCount === 1) {
        return [401, { data: null, message: 'Token expirado', status_code: 401 }];
      }
      return [200, { data: { id: 1 }, message: '', status_code: 200 }];
    });
    mock.onPost('/auth/refresh').reply(200, {
      data: { access_token: 'new-access', refresh_token: 'new-refresh' },
      message: 'Token renovado',
      status_code: 200,
    });

    const response = await apiClient.get('/auth/me');

    expect(response.status).toBe(200);
    expect(setStoredTokens).toHaveBeenCalledWith({
      accessToken: 'new-access',
      refreshToken: 'new-refresh',
    });
  });

  it('clears tokens and notifies on refresh failure', async () => {
    (getStoredTokens as jest.Mock).mockResolvedValue({
      accessToken: 'expired-access',
      refreshToken: 'invalid-refresh',
    });

    mock.onGet('/auth/me').reply(401, { data: null, message: 'Token expirado', status_code: 401 });
    mock.onPost('/auth/refresh').reply(401, { data: null, message: 'Refresh token inválido', status_code: 401 });

    const onFailure = jest.fn();
    setOnRefreshFailure(onFailure);

    await expect(apiClient.get('/auth/me')).rejects.toBeTruthy();
    expect(clearStoredTokens).toHaveBeenCalled();
    expect(onFailure).toHaveBeenCalled();

    setOnRefreshFailure(null);
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npm test -- client.test.ts`
Expected: FAIL — cannot find module `./client`.

- [ ] **Step 5: Implement**

```ts
// src/api/client.ts
import axios, { AxiosInstance } from 'axios';
import { getStoredTokens, setStoredTokens, clearStoredTokens, AuthTokens } from '../auth/storage';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5000';

export const apiClient: AxiosInstance = axios.create({ baseURL: API_BASE_URL });

// Instância separada só para a chamada de refresh, pra não reentrar nos
// interceptors de `apiClient` (evita loop infinito em caso de falha).
const refreshClient: AxiosInstance = axios.create({ baseURL: API_BASE_URL });

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
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm test -- client.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json src/api/client.ts src/api/client.test.ts .env.example .gitignore
git commit -m "Add Axios client with token-refresh interceptor"
```

(`.env` stays untracked on purpose — do not `git add` it.)

---

## Task 4: Auth API calls

**Files:**
- Create: `src/api/auth.ts`
- Test: `src/api/auth.test.ts`

**Interfaces:**
- Consumes: `apiClient` from `./client` (Task 3).
- Produces: `AuthUser`, `LoginResponse`, `AuthTokensResponse`, `ApiValidationError`, and `register()`, `login()`, `refreshToken()`, `getMe()`, `logout()`.

- [ ] **Step 1: Write the failing test**

```ts
// src/api/auth.test.ts
import { apiClient } from './client';
import { register, login, getMe, ApiValidationError } from './auth';

jest.mock('./client', () => ({
  apiClient: { post: jest.fn(), get: jest.fn() },
}));

describe('auth api', () => {
  afterEach(() => jest.clearAllMocks());

  it('register() posts to /auth/register and unwraps the user', async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({
      data: {
        data: { id: 1, name: 'testuser', email: 'test@example.com', role: 'cidadao', createdAt: '2026-01-01' },
        message: 'Usuário registrado com sucesso',
        status_code: 201,
      },
    });

    const user = await register({ username: 'testuser', email: 'test@example.com', password: '123456' });

    expect(apiClient.post).toHaveBeenCalledWith('/auth/register', {
      username: 'testuser',
      email: 'test@example.com',
      password: '123456',
    });
    expect(user.name).toBe('testuser');
  });

  it('register() throws ApiValidationError with field errors on 400', async () => {
    (apiClient.post as jest.Mock).mockRejectedValue({
      isAxiosError: true,
      response: {
        data: {
          data: { errors: { email: ['E-mail já cadastrado.'] } },
          message: 'Erro de validação',
          status_code: 400,
        },
      },
    });

    await expect(
      register({ username: 'testuser', email: 'dup@example.com', password: '123456' })
    ).rejects.toBeInstanceOf(ApiValidationError);
  });

  it('login() posts credentials and unwraps tokens + user', async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({
      data: {
        data: {
          access_token: 'access',
          refresh_token: 'refresh',
          user: { id: 1, name: 'testuser', email: 'test@example.com', role: 'cidadao', createdAt: '2026-01-01' },
        },
        message: 'Login realizado com sucesso',
        status_code: 200,
      },
    });

    const result = await login({ email: 'test@example.com', password: '123456' });

    expect(apiClient.post).toHaveBeenCalledWith('/auth/login', {
      email: 'test@example.com',
      password: '123456',
    });
    expect(result.access_token).toBe('access');
    expect(result.user.name).toBe('testuser');
  });

  it('getMe() gets /auth/me and unwraps the user', async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({
      data: {
        data: { id: 1, name: 'testuser', email: 'test@example.com', role: 'cidadao', createdAt: '2026-01-01' },
        message: '',
        status_code: 200,
      },
    });

    const user = await getMe();

    expect(apiClient.get).toHaveBeenCalledWith('/auth/me');
    expect(user.email).toBe('test@example.com');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- auth.test.ts`
Expected: FAIL — cannot find module `./auth`.

- [ ] **Step 3: Implement**

```ts
// src/api/auth.ts
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
```

Note: the test mocks `isAxiosError: true` directly on the rejected value, which satisfies `axios.isAxiosError` (it checks that flag) without needing a real Axios error instance.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- auth.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/api/auth.ts src/api/auth.test.ts
git commit -m "Add typed register/login/refresh/me/logout API calls"
```

---

## Task 5: AuthContext (global logged-in user state)

**Files:**
- Create: `src/auth/AuthContext.tsx`
- Test: `src/auth/AuthContext.test.tsx`

**Interfaces:**
- Consumes: `getStoredTokens`, `setStoredTokens`, `clearStoredTokens` (Task 2); `register`, `login` (as `apiRegister`/`apiLogin`), `getMe`, `logout` (as `apiLogout`), `AuthUser` (Task 4); `setOnRefreshFailure` (Task 3).
- Produces: `AuthStatus = 'bootstrapping' | 'guest' | 'authenticated'`, `AuthProvider`, `useAuth(): { status, user, login, register, logout }`.

- [ ] **Step 1: Write the failing test**

```tsx
// src/auth/AuthContext.test.tsx
import { render, screen, waitFor, act } from '@testing-library/react-native';
import { Text } from 'react-native';
import { AuthProvider, useAuth } from './AuthContext';
import { getStoredTokens, setStoredTokens, clearStoredTokens } from './storage';
import { login as apiLogin, getMe, logout as apiLogout } from '../api/auth';

jest.mock('./storage');
jest.mock('../api/auth');

function Probe() {
  const { status, user, login, logout } = useAuth();
  return (
    <>
      <Text testID="status">{status}</Text>
      <Text testID="user-name">{user?.name ?? ''}</Text>
      <Text testID="login" onPress={() => login('test@example.com', '123456')}>
        login
      </Text>
      <Text testID="logout" onPress={() => logout()}>
        logout
      </Text>
    </>
  );
}

describe('AuthContext', () => {
  afterEach(() => jest.clearAllMocks());

  it('starts as guest when there are no stored tokens', async () => {
    (getStoredTokens as jest.Mock).mockResolvedValue(null);

    render(<AuthProvider><Probe /></AuthProvider>);

    await waitFor(() => expect(screen.getByTestId('status').props.children).toBe('guest'));
  });

  it('restores the session when a stored token resolves via getMe()', async () => {
    (getStoredTokens as jest.Mock).mockResolvedValue({ accessToken: 'a', refreshToken: 'b' });
    (getMe as jest.Mock).mockResolvedValue({ id: 1, name: 'testuser', email: 'test@example.com', role: 'cidadao', createdAt: '2026-01-01' });

    render(<AuthProvider><Probe /></AuthProvider>);

    await waitFor(() => expect(screen.getByTestId('status').props.children).toBe('authenticated'));
    expect(screen.getByTestId('user-name').props.children).toBe('testuser');
  });

  it('falls back to guest and clears tokens when getMe() fails on boot', async () => {
    (getStoredTokens as jest.Mock).mockResolvedValue({ accessToken: 'a', refreshToken: 'b' });
    (getMe as jest.Mock).mockRejectedValue(new Error('unauthorized'));

    render(<AuthProvider><Probe /></AuthProvider>);

    await waitFor(() => expect(screen.getByTestId('status').props.children).toBe('guest'));
    expect(clearStoredTokens).toHaveBeenCalled();
  });

  it('login() stores tokens and moves to authenticated', async () => {
    (getStoredTokens as jest.Mock).mockResolvedValue(null);
    (apiLogin as jest.Mock).mockResolvedValue({
      access_token: 'access',
      refresh_token: 'refresh',
      user: { id: 1, name: 'testuser', email: 'test@example.com', role: 'cidadao', createdAt: '2026-01-01' },
    });

    render(<AuthProvider><Probe /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('status').props.children).toBe('guest'));

    await act(async () => {
      screen.getByTestId('login').props.onPress();
    });

    expect(setStoredTokens).toHaveBeenCalledWith({ accessToken: 'access', refreshToken: 'refresh' });
    await waitFor(() => expect(screen.getByTestId('status').props.children).toBe('authenticated'));
  });

  it('logout() clears tokens and moves to guest', async () => {
    (getStoredTokens as jest.Mock).mockResolvedValue({ accessToken: 'a', refreshToken: 'b' });
    (getMe as jest.Mock).mockResolvedValue({ id: 1, name: 'testuser', email: 'test@example.com', role: 'cidadao', createdAt: '2026-01-01' });
    (apiLogout as jest.Mock).mockResolvedValue(null);

    render(<AuthProvider><Probe /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('status').props.children).toBe('authenticated'));

    await act(async () => {
      screen.getByTestId('logout').props.onPress();
    });

    expect(clearStoredTokens).toHaveBeenCalled();
    await waitFor(() => expect(screen.getByTestId('status').props.children).toBe('guest'));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- AuthContext.test.tsx`
Expected: FAIL — cannot find module `./AuthContext`.

- [ ] **Step 3: Implement**

```tsx
// src/auth/AuthContext.tsx
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getStoredTokens, setStoredTokens, clearStoredTokens } from './storage';
import { setOnRefreshFailure } from '../api/client';
import {
  register as apiRegister,
  login as apiLogin,
  getMe,
  logout as apiLogout,
  type AuthUser,
} from '../api/auth';

export type AuthStatus = 'bootstrapping' | 'guest' | 'authenticated';

export type AuthContextValue = {
  status: AuthStatus;
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('bootstrapping');
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      const tokens = await getStoredTokens();
      if (!tokens) {
        if (isMounted) setStatus('guest');
        return;
      }
      try {
        const me = await getMe();
        if (isMounted) {
          setUser(me);
          setStatus('authenticated');
        }
      } catch {
        await clearStoredTokens();
        if (isMounted) setStatus('guest');
      }
    }

    bootstrap();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    // Se o interceptor do axios falhar ao renovar o token em qualquer
    // chamada futura, força o app de volta pro estado deslogado.
    setOnRefreshFailure(() => {
      setUser(null);
      setStatus('guest');
    });
    return () => setOnRefreshFailure(null);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await apiLogin({ email, password });
    await setStoredTokens({ accessToken: result.access_token, refreshToken: result.refresh_token });
    setUser(result.user);
    setStatus('authenticated');
  }, []);

  const register = useCallback(
    async (username: string, email: string, password: string) => {
      await apiRegister({ username, email, password });
      // Cadastro bem-sucedido já loga o usuário, evitando uma segunda tela manual.
      await login(email, password);
    },
    [login]
  );

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      // Sem rede ou token já expirado: os tokens locais são limpos de todo modo.
    }
    await clearStoredTokens();
    setUser(null);
    setStatus('guest');
  }, []);

  const value = useMemo(
    () => ({ status, user, login, register, logout }),
    [status, user, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- AuthContext.test.tsx`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/auth/AuthContext.tsx src/auth/AuthContext.test.tsx
git commit -m "Add AuthContext with bootstrap/login/register/logout state machine"
```

---

## Task 6: Icon component

**Files:**
- Create: `src/components/Icon/index.tsx`
- Test: `src/components/Icon/Icon.test.tsx`

**Interfaces:**
- Produces: `IconName` (`'home' | 'map' | 'demands' | 'profile' | 'mail' | 'lock' | 'eye' | 'eyeOff'`), `Icon({ name, size?, color?, strokeWidth?, testID? })`.

- [ ] **Step 1: Install lucide-react-native and its svg dependency**

```bash
npx expo install react-native-svg
npm install lucide-react-native
```

- [ ] **Step 2: Write the failing test**

```tsx
// src/components/Icon/Icon.test.tsx
import { render } from '@testing-library/react-native';
import { Icon, type IconName } from './index';

describe('Icon', () => {
  it('renders without throwing for every mapped icon name', () => {
    const names: IconName[] = ['home', 'map', 'demands', 'profile', 'mail', 'lock', 'eye', 'eyeOff'];
    names.forEach((name) => {
      expect(() => render(<Icon name={name} />)).not.toThrow();
    });
  });

  it('forwards size and color to the underlying svg', () => {
    const { getByTestId } = render(<Icon name="mail" size={32} color="#205072" testID="icon-mail" />);
    const element = getByTestId('icon-mail');
    expect(element.props.width).toBe(32);
    expect(element.props.height).toBe(32);
    expect(element.props.stroke).toBe('#205072');
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- Icon.test.tsx`
Expected: FAIL — cannot find module `./index`.

- [ ] **Step 4: Implement**

```tsx
// src/components/Icon/index.tsx
import { House, MapPin, ClipboardList, User, Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { colors } from '../../theme';

const ICONS = {
  home: House,
  map: MapPin,
  demands: ClipboardList,
  profile: User,
  mail: Mail,
  lock: Lock,
  eye: Eye,
  eyeOff: EyeOff,
};

export type IconName = keyof typeof ICONS;

export type IconProps = {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  testID?: string;
};

export function Icon({ name, size = 24, color = colors.navy, strokeWidth = 2, testID }: IconProps) {
  const LucideComponent = ICONS[name];
  return <LucideComponent size={size} color={color} strokeWidth={strokeWidth} testID={testID} />;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- Icon.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/components/Icon
git commit -m "Add Icon component wrapping lucide-react-native"
```

---

## Task 7: Loading component

**Files:**
- Create: `src/components/Loading/index.tsx`
- Test: `src/components/Loading/Loading.test.tsx`

**Interfaces:**
- Produces: `Loading({ size?: 'small' | 'large', color?: string, testID? })`.

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/Loading/Loading.test.tsx
import { render } from '@testing-library/react-native';
import { Loading } from './index';

describe('Loading', () => {
  it('renders an activity indicator with the given color', () => {
    const { getByTestId } = render(<Loading color="#fff" testID="loading" />);
    expect(getByTestId('loading').props.color).toBe('#fff');
  });

  it('defaults to the primary brand color', () => {
    const { getByTestId } = render(<Loading testID="loading" />);
    expect(getByTestId('loading').props.color).toBe('#329D9C');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- Loading.test.tsx`
Expected: FAIL — cannot find module `./index`.

- [ ] **Step 3: Implement**

```tsx
// src/components/Loading/index.tsx
import { ActivityIndicator } from 'react-native';
import { colors } from '../../theme';

export type LoadingProps = {
  size?: 'small' | 'large';
  color?: string;
  testID?: string;
};

export function Loading({ size = 'large', color = colors.primary, testID }: LoadingProps) {
  return <ActivityIndicator size={size} color={color} testID={testID} />;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- Loading.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/Loading
git commit -m "Add Loading component"
```

---

## Task 8: Reanimated setup + Button component

**Files:**
- Create: `babel.config.js`
- Modify: `package.json` (jest `setupFiles`)
- Create: `src/components/Button/index.tsx`
- Test: `src/components/Button/Button.test.tsx`

**Interfaces:**
- Consumes: `Loading` (Task 7), `colors`/`fonts` (`src/theme`).
- Produces: `ButtonVariant = 'primary' | 'secondary'`, `Button({ label, onPress, variant?, disabled?, loading?, testID? })`.

- [ ] **Step 1: Install Reanimated**

```bash
npx expo install react-native-reanimated
```

- [ ] **Step 2: Add the babel plugin**

```js
// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-reanimated/plugin'],
  };
};
```

- [ ] **Step 3: Register Reanimated's Jest setup**

> **Note (updated post-Task 5 by a controller ruling):** Task 5's fix round added
> a `jest.setup.js` at the repo root (console.error suppression for a known
> `@testing-library/react-native` `act()`-warning quirk) registered under
> **`setupFilesAfterEnv`**, a different key from the one this step uses. There is
> no collision — just add `setupFiles` as a new key alongside the existing
> `setupFilesAfterEnv` entry; don't touch `setupFilesAfterEnv`.

In `package.json`, extend the `"jest"` block (add the `setupFiles` key; keep the existing `setupFilesAfterEnv` key untouched):

```json
"jest": {
  "preset": "jest-expo",
  "setupFilesAfterEnv": ["<rootDir>/jest.setup.js"],
  "setupFiles": ["react-native-reanimated/jestSetup"]
}
```

- [ ] **Step 4: Write the failing test**

```tsx
// src/components/Button/Button.test.tsx
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from './index';

describe('Button', () => {
  it('calls onPress when pressed and enabled', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(<Button label="Entrar" onPress={onPress} testID="btn" />);
    fireEvent.press(getByTestId('btn'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(<Button label="Entrar" onPress={onPress} disabled testID="btn" />);
    fireEvent.press(getByTestId('btn'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('shows a loading indicator and blocks presses while loading', () => {
    const onPress = jest.fn();
    const { getByTestId, queryByText } = render(
      <Button label="Entrar" onPress={onPress} loading testID="btn" />
    );
    fireEvent.press(getByTestId('btn'));
    expect(onPress).not.toHaveBeenCalled();
    expect(queryByText('Entrar')).toBeNull();
  });
});
```

- [ ] **Step 5: Run test to verify it fails**

Run: `npm test -- Button.test.tsx`
Expected: FAIL — cannot find module `./index`.

- [ ] **Step 6: Implement**

```tsx
// src/components/Button/index.tsx
import { Pressable, Text, StyleSheet, type GestureResponderEvent } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { colors, fonts } from '../../theme';
import { Loading } from '../Loading';

export type ButtonVariant = 'primary' | 'secondary';

export type ButtonProps = {
  label: string;
  onPress: (event: GestureResponderEvent) => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  testID?: string;
};

const VARIANT_COLORS: Record<ButtonVariant, string> = {
  primary: colors.primary,
  secondary: colors.secondary,
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  testID,
}: ButtonProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const isInteractive = !disabled && !loading;

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        testID={testID}
        onPress={isInteractive ? onPress : undefined}
        disabled={!isInteractive}
        onPressIn={() => {
          if (isInteractive) scale.value = withTiming(0.96, { duration: 100 });
        }}
        onPressOut={() => {
          scale.value = withTiming(1, { duration: 100 });
        }}
        style={[styles.base, { backgroundColor: VARIANT_COLORS[variant] }, !isInteractive && styles.disabled]}
      >
        {loading ? <Loading size="small" color="#fff" /> : <Text style={styles.label}>{label}</Text>}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontFamily: fonts.inter.bold,
    fontSize: 16,
    color: '#fff',
  },
});
```

- [ ] **Step 7: Run test to verify it passes**

Run: `npm test -- Button.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json babel.config.js src/components/Button
git commit -m "Add react-native-reanimated and the Button component"
```

---

## Task 9: GradientBackground component

**Files:**
- Create: `src/components/GradientBackground/index.tsx`
- Test: `src/components/GradientBackground/GradientBackground.test.tsx`

**Interfaces:**
- Produces: `GradientBackground({ children?, style? })`.

- [ ] **Step 1: Install expo-linear-gradient**

```bash
npx expo install expo-linear-gradient
```

- [ ] **Step 2: Write the failing test**

```tsx
// src/components/GradientBackground/GradientBackground.test.tsx
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { GradientBackground } from './index';
import { colors } from '../../theme';

describe('GradientBackground', () => {
  it('renders its children', () => {
    const { getByText } = render(
      <GradientBackground>
        <Text>Oi</Text>
      </GradientBackground>
    );
    expect(getByText('Oi')).toBeTruthy();
  });

  it('uses the brand gradient colors in order', () => {
    const { getByTestId } = render(<GradientBackground testID="gradient" />);
    expect(getByTestId('gradient').props.colors).toEqual([colors.secondary, colors.primary, colors.navy]);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- GradientBackground.test.tsx`
Expected: FAIL — cannot find module `./index`.

- [ ] **Step 4: Implement**

```tsx
// src/components/GradientBackground/index.tsx
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme';

export type GradientBackgroundProps = {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function GradientBackground({ children, style, testID }: GradientBackgroundProps) {
  return (
    <LinearGradient
      testID={testID}
      colors={[colors.secondary, colors.primary, colors.navy]}
      locations={[0.2, 0.5, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={[styles.fill, style]}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- GradientBackground.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/components/GradientBackground
git commit -m "Add GradientBackground component"
```

---

## Task 10: TextField component

**Files:**
- Create: `src/components/TextField/index.tsx`
- Test: `src/components/TextField/TextField.test.tsx`

**Interfaces:**
- Consumes: `Icon`, `IconName` (Task 6); `colors`, `fonts` (`src/theme`).
- Produces: `TextField({ label, value, onChangeText, onBlur?, error?, icon?, secureTextEntry?, autoCapitalize?, keyboardType?, testID? })`.

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/TextField/TextField.test.tsx
import { render, fireEvent } from '@testing-library/react-native';
import { TextField } from './index';

describe('TextField', () => {
  it('calls onChangeText as the user types', () => {
    const onChangeText = jest.fn();
    const { getByTestId } = render(
      <TextField label="Email" value="" onChangeText={onChangeText} testID="field-email" />
    );
    fireEvent.changeText(getByTestId('field-email-input'), 'a@b.com');
    expect(onChangeText).toHaveBeenCalledWith('a@b.com');
  });

  it('shows the error message when error is set', () => {
    const { getByText } = render(
      <TextField label="Email" value="" onChangeText={jest.fn()} error="E-mail inválido" testID="field-email" />
    );
    expect(getByText('E-mail inválido')).toBeTruthy();
  });

  it('does not render an error message when there is no error', () => {
    const { queryByTestId } = render(
      <TextField label="Email" value="" onChangeText={jest.fn()} testID="field-email" />
    );
    expect(queryByTestId('field-email-error')).toBeNull();
  });

  it('toggles password visibility for secureTextEntry fields', () => {
    const { getByTestId } = render(
      <TextField
        label="Senha"
        value="segredo"
        onChangeText={jest.fn()}
        secureTextEntry
        testID="field-senha"
      />
    );
    const input = getByTestId('field-senha-input');
    expect(input.props.secureTextEntry).toBe(true);

    fireEvent.press(getByTestId('field-senha-toggle'));
    expect(input.props.secureTextEntry).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- TextField.test.tsx`
Expected: FAIL — cannot find module `./index`.

- [ ] **Step 3: Implement**

```tsx
// src/components/TextField/index.tsx
import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, type KeyboardTypeOptions } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, interpolateColor } from 'react-native-reanimated';
import { Icon, type IconName } from '../Icon';
import { colors, fonts } from '../../theme';

const ERROR_COLOR = '#E53935';
const DEFAULT_BORDER = '#E0E0E0';

export type TextFieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  onBlur?: () => void;
  error?: string;
  icon?: IconName;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: KeyboardTypeOptions;
  testID?: string;
};

export function TextField({
  label,
  value,
  onChangeText,
  onBlur,
  error,
  icon,
  secureTextEntry = false,
  autoCapitalize = 'none',
  keyboardType = 'default',
  testID = 'field',
}: TextFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const focusProgress = useSharedValue(0);

  const borderColor = error ? ERROR_COLOR : isFocused ? colors.primary : value ? colors.secondary : DEFAULT_BORDER;

  const animatedStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(focusProgress.value, [0, 1], [DEFAULT_BORDER, colors.primary]),
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Animated.View style={[styles.field, { borderColor }, error && animatedStyle]}>
        {icon && <Icon name={icon} size={20} color={borderColor} />}
        <TextInput
          testID={`${testID}-input`}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => {
            setIsFocused(true);
            focusProgress.value = withTiming(1, { duration: 150 });
          }}
          onBlur={() => {
            setIsFocused(false);
            focusProgress.value = withTiming(0, { duration: 150 });
            onBlur?.();
          }}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          style={styles.input}
        />
        {secureTextEntry && (
          <Pressable
            testID={`${testID}-toggle`}
            onPress={() => setIsPasswordVisible((prev) => !prev)}
          >
            <Icon name={isPasswordVisible ? 'eyeOff' : 'eye'} size={20} color={colors.navy} />
          </Pressable>
        )}
      </Animated.View>
      {error && (
        <Text testID={`${testID}-error`} style={styles.error}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
  },
  label: {
    fontFamily: fonts.inter.medium,
    fontSize: 14,
    color: colors.navy,
    marginBottom: 4,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 48,
    borderWidth: 2,
    borderRadius: 24,
    paddingHorizontal: 16,
    backgroundColor: '#F4F4F4',
  },
  input: {
    flex: 1,
    fontFamily: fonts.inter.regular,
    fontSize: 16,
    color: colors.navy,
  },
  error: {
    fontFamily: fonts.inter.medium,
    fontSize: 12,
    color: ERROR_COLOR,
    marginTop: 4,
  },
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- TextField.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/TextField
git commit -m "Add TextField component with focus/error/password-toggle states"
```

---

## Task 11: Navigation skeleton + App wiring

**Files:**
- Create: `src/screens/LoadingScreen.tsx`
- Test: `src/screens/LoadingScreen.test.tsx`
- Create: `src/screens/auth/LoginScreen.tsx` (placeholder content)
- Create: `src/screens/auth/CadastroScreen.tsx` (placeholder content)
- Create: `src/screens/home/HomeScreen.tsx` (placeholder content)
- Create: `src/screens/home/PlaceholderScreen.tsx`
- Test: `src/screens/home/PlaceholderScreen.test.tsx`
- Create: `src/navigation/AuthStack.tsx`
- Create: `src/navigation/AppTabs.tsx`
- Create: `src/navigation/RootNavigator.tsx`
- Test: `src/navigation/RootNavigator.test.tsx`
- Test: `src/navigation/AuthStack.test.tsx`
- Test: `src/navigation/AppTabs.test.tsx`
- Modify: `App.tsx`
- Modify: `App.test.tsx`

**Interfaces:**
- Consumes: `useAuth` (Task 5), `GradientBackground` (Task 9), `Loading` (Task 7), `Icon`/`IconName` (Task 6), `AuthProvider` (Task 5), `fontAssets` (`src/theme`).
- Produces: `RootNavigator`, `AuthStack` (screens `Login`, `Cadastro`), `AppTabs` (tabs `Inicio`, `Mapa`, `Demandas`, `Perfil`), `PlaceholderScreen({ title })`.

- [ ] **Step 1: Install navigation dependencies**

```bash
npx expo install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs react-native-screens react-native-safe-area-context react-native-gesture-handler
```

- [ ] **Step 2: Create the reusable placeholder screen, with its test**

```tsx
// src/screens/home/PlaceholderScreen.test.tsx
import { render, screen } from '@testing-library/react-native';
import { PlaceholderScreen } from './PlaceholderScreen';

describe('PlaceholderScreen', () => {
  it('renders the given title and an "em construção" note', () => {
    render(<PlaceholderScreen title="Mapa" />);
    expect(screen.getByText('Mapa')).toBeTruthy();
    expect(screen.getByText('Em construção')).toBeTruthy();
  });
});
```

```tsx
// src/screens/home/PlaceholderScreen.tsx
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts } from '../../theme';

export function PlaceholderScreen({ title }: { title: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>Em construção</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  title: { fontFamily: fonts.inter.extraBold, fontSize: 24, color: colors.navy },
  subtitle: { fontFamily: fonts.inter.medium, fontSize: 14, color: '#90A4AE' },
});
```

Run: `npm test -- PlaceholderScreen.test.tsx` → PASS (1 test).

- [ ] **Step 3: Create the loading screen (final content), with its test**

```tsx
// src/screens/LoadingScreen.test.tsx
import { render, screen } from '@testing-library/react-native';
import { LoadingScreen } from './LoadingScreen';

describe('LoadingScreen', () => {
  it('renders the logo and a spinner', () => {
    render(<LoadingScreen />);
    expect(screen.getByTestId('loading-logo')).toBeTruthy();
    expect(screen.getByTestId('loading-spinner')).toBeTruthy();
  });
});
```

```tsx
// src/screens/LoadingScreen.tsx
import { StyleSheet, Image } from 'react-native';
import { GradientBackground } from '../components/GradientBackground';
import { Loading } from '../components/Loading';

export function LoadingScreen() {
  return (
    <GradientBackground style={styles.container}>
      <Image
        testID="loading-logo"
        source={require('../../assets/icons/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Loading color="#fff" testID="loading-spinner" />
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', gap: 24 },
  logo: { width: 160, height: 160 },
});
```

Run: `npm test -- LoadingScreen.test.tsx` → PASS (1 test).

- [ ] **Step 4: Create placeholder auth screens (own files, filled in Tasks 12–13)**

```tsx
// src/screens/auth/LoginScreen.tsx
import { View, Text, Pressable } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/AuthStack';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  return (
    <View>
      <Text>Login</Text>
      <Pressable testID="go-to-cadastro" onPress={() => navigation.navigate('Cadastro')}>
        <Text>Cadastre-se</Text>
      </Pressable>
    </View>
  );
}
```

```tsx
// src/screens/auth/CadastroScreen.tsx
import { View, Text, Pressable } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/AuthStack';

type Props = NativeStackScreenProps<AuthStackParamList, 'Cadastro'>;

export function CadastroScreen({ navigation }: Props) {
  return (
    <View>
      <Text>Cadastro</Text>
      <Pressable testID="go-to-login" onPress={() => navigation.navigate('Login')}>
        <Text>Entrar</Text>
      </Pressable>
    </View>
  );
}
```

```tsx
// src/screens/home/HomeScreen.tsx
import { View, Text } from 'react-native';

export function HomeScreen() {
  return (
    <View>
      <Text>Início</Text>
    </View>
  );
}
```

- [ ] **Step 5: Create the auth stack**

```tsx
// src/navigation/AuthStack.tsx
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { CadastroScreen } from '../screens/auth/CadastroScreen';

export type AuthStackParamList = {
  Login: undefined;
  Cadastro: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Cadastro" component={CadastroScreen} />
    </Stack.Navigator>
  );
}
```

- [ ] **Step 6: Create the app tabs**

```tsx
// src/navigation/AppTabs.tsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Icon, type IconName } from '../components/Icon';
import { HomeScreen } from '../screens/home/HomeScreen';
import { PlaceholderScreen } from '../screens/home/PlaceholderScreen';
import { colors } from '../theme';

export type AppTabsParamList = {
  Inicio: undefined;
  Mapa: undefined;
  Demandas: undefined;
  Perfil: undefined;
};

const Tab = createBottomTabNavigator<AppTabsParamList>();

const TAB_ICONS: Record<keyof AppTabsParamList, IconName> = {
  Inicio: 'home',
  Mapa: 'map',
  Demandas: 'demands',
  Perfil: 'profile',
};

export function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#90A4AE',
        tabBarIcon: ({ color, size }: { color: string; size: number }) => (
          <Icon name={TAB_ICONS[route.name as keyof AppTabsParamList]} color={color} size={size} />
        ),
      })}
    >
      <Tab.Screen name="Inicio" component={HomeScreen} options={{ title: 'Início' }} />
      <Tab.Screen name="Mapa" options={{ title: 'Mapa' }}>
        {() => <PlaceholderScreen title="Mapa" />}
      </Tab.Screen>
      <Tab.Screen name="Demandas" options={{ title: 'Demandas' }}>
        {() => <PlaceholderScreen title="Demandas" />}
      </Tab.Screen>
      <Tab.Screen name="Perfil" options={{ title: 'Perfil' }}>
        {() => <PlaceholderScreen title="Perfil" />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
```

- [ ] **Step 7: Create the root navigator**

```tsx
// src/navigation/RootNavigator.tsx
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../auth/AuthContext';
import { LoadingScreen } from '../screens/LoadingScreen';
import { AuthStack } from './AuthStack';
import { AppTabs } from './AppTabs';

const Stack = createNativeStackNavigator();

export function RootNavigator() {
  const { status } = useAuth();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {status === 'bootstrapping' && <Stack.Screen name="Loading" component={LoadingScreen} />}
      {status === 'guest' && <Stack.Screen name="Auth" component={AuthStack} />}
      {status === 'authenticated' && <Stack.Screen name="App" component={AppTabs} />}
    </Stack.Navigator>
  );
}
```

- [ ] **Step 8: Write the navigation tests**

```tsx
// src/navigation/RootNavigator.test.tsx
import { render, screen } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { RootNavigator } from './RootNavigator';
import { useAuth } from '../auth/AuthContext';

jest.mock('../auth/AuthContext');

describe('RootNavigator', () => {
  it('shows the loading screen while bootstrapping', () => {
    (useAuth as jest.Mock).mockReturnValue({ status: 'bootstrapping' });
    render(<NavigationContainer><RootNavigator /></NavigationContainer>);
    expect(screen.queryByText('Login')).toBeNull();
  });

  it('shows the auth stack when unauthenticated', () => {
    (useAuth as jest.Mock).mockReturnValue({ status: 'guest' });
    render(<NavigationContainer><RootNavigator /></NavigationContainer>);
    expect(screen.getByText('Login')).toBeTruthy();
  });

  it('shows the app tabs when authenticated', () => {
    (useAuth as jest.Mock).mockReturnValue({ status: 'authenticated' });
    render(<NavigationContainer><RootNavigator /></NavigationContainer>);
    expect(screen.getByText('Início')).toBeTruthy();
  });
});
```

```tsx
// src/navigation/AuthStack.test.tsx
import { render, screen, fireEvent } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { AuthStack } from './AuthStack';

describe('AuthStack', () => {
  it('starts on Login and navigates to Cadastro', () => {
    render(<NavigationContainer><AuthStack /></NavigationContainer>);
    expect(screen.getByText('Login')).toBeTruthy();

    fireEvent.press(screen.getByTestId('go-to-cadastro'));
    expect(screen.getByText('Cadastro')).toBeTruthy();
  });
});
```

```tsx
// src/navigation/AppTabs.test.tsx
import { render, screen } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { AppTabs } from './AppTabs';

describe('AppTabs', () => {
  it('renders all four tabs with Início as the initial route', () => {
    render(<NavigationContainer><AppTabs /></NavigationContainer>);
    expect(screen.getByText('Início')).toBeTruthy();
    expect(screen.getAllByText('Mapa').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Demandas').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Perfil').length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 9: Wire `App.tsx`**

```tsx
// App.tsx
import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';

import { fontAssets } from './src/theme';
import { AuthProvider } from './src/auth/AuthContext';
import { RootNavigator } from './src/navigation/RootNavigator';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
          <StatusBar style="auto" />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
```

- [ ] **Step 10: Update the App smoke test**

```tsx
// App.test.tsx
import { render, screen, waitFor } from '@testing-library/react-native';

jest.mock('expo-font', () => ({ useFonts: () => [true, null] }));
jest.mock('./src/auth/storage');

import { getStoredTokens } from './src/auth/storage';
import App from './App';

describe('App', () => {
  it('boots to the auth stack when there is no stored session', async () => {
    (getStoredTokens as jest.Mock).mockResolvedValue(null);
    render(<App />);
    await waitFor(() => expect(screen.getByText('Login')).toBeTruthy());
  });
});
```

- [ ] **Step 11: Run all tests to verify they pass**

Run: `npm test`
Expected: PASS (all suites, including the new navigation tests and the updated App test).

- [ ] **Step 12: Commit**

```bash
git add package.json package-lock.json App.tsx App.test.tsx src/screens src/navigation
git commit -m "Add navigation shell (Loading/Auth/Tabs) and wire it into App.tsx"
```

(`babel.config.js` was already committed in Task 8 — nothing new to add there.)

---

## Task 12: LoginScreen (full implementation)

**Files:**
- Modify: `src/screens/auth/LoginScreen.tsx`
- Create: `src/screens/auth/LoginScreen.schema.ts`
- Test: `src/screens/auth/LoginScreen.schema.test.ts`
- Test: `src/screens/auth/LoginScreen.test.tsx`

**Interfaces:**
- Consumes: `useAuth` (Task 5), `TextField` (Task 10), `Button` (Task 8), `GradientBackground` (Task 9), `AuthStackParamList` (Task 11).
- Produces: `loginSchema`, `LoginFormValues`.

- [ ] **Step 1: Install react-hook-form, zod and the resolver**

```bash
npm install react-hook-form zod @hookform/resolvers
```

- [ ] **Step 2: Write the failing schema test**

```ts
// src/screens/auth/LoginScreen.schema.test.ts
import { loginSchema } from './LoginScreen.schema';

describe('loginSchema', () => {
  it('accepts a valid email and password', () => {
    const result = loginSchema.safeParse({ email: 'test@example.com', password: '123456' });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid email', () => {
    const result = loginSchema.safeParse({ email: 'not-an-email', password: '123456' });
    expect(result.success).toBe(false);
  });

  it('rejects a password shorter than 6 characters', () => {
    const result = loginSchema.safeParse({ email: 'test@example.com', password: '123' });
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- LoginScreen.schema.test.ts`
Expected: FAIL — cannot find module `./LoginScreen.schema`.

- [ ] **Step 4: Implement the schema**

```ts
// src/screens/auth/LoginScreen.schema.ts
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().min(1, 'Informe seu e-mail').email('E-mail inválido'),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
```

- [ ] **Step 5: Run schema test to verify it passes**

Run: `npm test -- LoginScreen.schema.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 6: Write the failing screen test**

```tsx
// src/screens/auth/LoginScreen.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from './LoginScreen';
import { useAuth } from '../../auth/AuthContext';

jest.mock('../../auth/AuthContext');

const Stack = createNativeStackNavigator();
function renderScreen() {
  return render(
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Cadastro" component={() => null} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

describe('LoginScreen', () => {
  afterEach(() => jest.clearAllMocks());

  it('shows validation errors for empty fields on submit', async () => {
    (useAuth as jest.Mock).mockReturnValue({ login: jest.fn() });
    renderScreen();

    fireEvent.press(screen.getByTestId('login-submit'));

    await waitFor(() => expect(screen.getByText('Informe seu e-mail')).toBeTruthy());
  });

  it('calls useAuth().login with the typed credentials on valid submit', async () => {
    const login = jest.fn().mockResolvedValue(undefined);
    (useAuth as jest.Mock).mockReturnValue({ login });
    renderScreen();

    fireEvent.changeText(screen.getByTestId('login-email-input'), 'test@example.com');
    fireEvent.changeText(screen.getByTestId('login-password-input'), '123456');
    fireEvent.press(screen.getByTestId('login-submit'));

    await waitFor(() => expect(login).toHaveBeenCalledWith('test@example.com', '123456'));
  });

  it('shows an error banner when login rejects', async () => {
    const login = jest.fn().mockRejectedValue(new Error('E-mail ou senha incorretos.'));
    (useAuth as jest.Mock).mockReturnValue({ login });
    renderScreen();

    fireEvent.changeText(screen.getByTestId('login-email-input'), 'test@example.com');
    fireEvent.changeText(screen.getByTestId('login-password-input'), '123456');
    fireEvent.press(screen.getByTestId('login-submit'));

    await waitFor(() => expect(screen.getByText('E-mail ou senha incorretos.')).toBeTruthy());
  });
});
```

- [ ] **Step 7: Run test to verify it fails**

Run: `npm test -- LoginScreen.test.tsx`
Expected: FAIL — current `LoginScreen` has none of these test IDs/behavior yet.

- [ ] **Step 8: Implement the screen**

```tsx
// src/screens/auth/LoginScreen.tsx
import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/AuthStack';
import { GradientBackground } from '../../components/GradientBackground';
import { TextField } from '../../components/TextField';
import { Button } from '../../components/Button';
import { useAuth } from '../../auth/AuthContext';
import { colors, fonts } from '../../theme';
import { loginSchema, type LoginFormValues } from './LoginScreen.schema';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(values: LoginFormValues) {
    setSubmitError(null);
    try {
      await login(values.email, values.password);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Não foi possível entrar.');
    }
  }

  return (
    <GradientBackground style={styles.container}>
      <Text style={styles.title}>Login</Text>

      <Controller
        control={control}
        name="email"
        render={({ field }) => (
          <TextField
            label="Email"
            icon="mail"
            keyboardType="email-address"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.email?.message}
            testID="login-email"
          />
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field }) => (
          <TextField
            label="Senha"
            icon="lock"
            secureTextEntry
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.password?.message}
            testID="login-password"
          />
        )}
      />

      {submitError && <Text style={styles.error}>{submitError}</Text>}

      <Button
        label="Entrar"
        loading={isSubmitting}
        onPress={handleSubmit(onSubmit)}
        testID="login-submit"
      />

      <Pressable testID="go-to-cadastro" onPress={() => navigation.navigate('Cadastro')}>
        <Text style={styles.link}>Não tem conta? Cadastre-se</Text>
      </Pressable>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  title: { fontFamily: fonts.inter.extraBold, fontSize: 36, color: colors.navy },
  error: { fontFamily: fonts.inter.medium, fontSize: 14, color: '#E53935' },
  link: { fontFamily: fonts.inter.medium, fontSize: 14, color: '#fff' },
});
```

- [ ] **Step 9: Run test to verify it passes**

Run: `npm test -- LoginScreen.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 10: Run the full suite (this screen's rewrite can affect AuthStack/RootNavigator/App tests, which assert on the literal text "Login")**

Run: `npm test`
Expected: `AuthStack.test.tsx` and `RootNavigator.test.tsx` still look for the text "Login" — since the title `<Text>` still renders "Login", they keep passing. `App.test.tsx` still passes for the same reason. If anything fails, adjust the failing test's query to match the new screen (do not weaken the LoginScreen implementation to fit a stale assertion).

- [ ] **Step 11: Commit**

```bash
git add package.json package-lock.json src/screens/auth/LoginScreen.tsx src/screens/auth/LoginScreen.schema.ts src/screens/auth/LoginScreen.schema.test.ts src/screens/auth/LoginScreen.test.tsx
git commit -m "Implement LoginScreen with validated form and error handling"
```

---

## Task 13: CadastroScreen (full implementation)

**Files:**
- Modify: `src/screens/auth/CadastroScreen.tsx`
- Create: `src/screens/auth/CadastroScreen.schema.ts`
- Test: `src/screens/auth/CadastroScreen.schema.test.ts`
- Test: `src/screens/auth/CadastroScreen.test.tsx`

**Interfaces:**
- Consumes: same building blocks as Task 12, plus `useAuth().register`.
- Produces: `cadastroSchema`, `CadastroFormValues`.

- [ ] **Step 1: Write the failing schema test**

```ts
// src/screens/auth/CadastroScreen.schema.test.ts
import { cadastroSchema } from './CadastroScreen.schema';

describe('cadastroSchema', () => {
  const base = {
    username: 'testuser',
    email: 'test@example.com',
    password: '123456',
    confirmPassword: '123456',
  };

  it('accepts valid, matching data', () => {
    expect(cadastroSchema.safeParse(base).success).toBe(true);
  });

  it('rejects a username shorter than 3 characters', () => {
    expect(cadastroSchema.safeParse({ ...base, username: 'ab' }).success).toBe(false);
  });

  it('rejects mismatched passwords', () => {
    const result = cadastroSchema.safeParse({ ...base, confirmPassword: 'different' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('confirmPassword');
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- CadastroScreen.schema.test.ts`
Expected: FAIL — cannot find module `./CadastroScreen.schema`.

- [ ] **Step 3: Implement the schema**

```ts
// src/screens/auth/CadastroScreen.schema.ts
import { z } from 'zod';

export const cadastroSchema = z
  .object({
    username: z.string().min(3, 'Mínimo de 3 caracteres').max(50, 'Máximo de 50 caracteres'),
    email: z.string().min(1, 'Informe seu e-mail').email('E-mail inválido'),
    password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
    confirmPassword: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });

export type CadastroFormValues = z.infer<typeof cadastroSchema>;
```

- [ ] **Step 4: Run schema test to verify it passes**

Run: `npm test -- CadastroScreen.schema.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Write the failing screen test**

```tsx
// src/screens/auth/CadastroScreen.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CadastroScreen } from './CadastroScreen';
import { useAuth } from '../../auth/AuthContext';
import { ApiValidationError } from '../../api/auth';

jest.mock('../../auth/AuthContext');

const Stack = createNativeStackNavigator();
function renderScreen() {
  return render(
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Cadastro" component={CadastroScreen} />
        <Stack.Screen name="Login" component={() => null} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function fillValidForm() {
  fireEvent.changeText(screen.getByTestId('cadastro-username-input'), 'testuser');
  fireEvent.changeText(screen.getByTestId('cadastro-email-input'), 'test@example.com');
  fireEvent.changeText(screen.getByTestId('cadastro-password-input'), '123456');
  fireEvent.changeText(screen.getByTestId('cadastro-confirmPassword-input'), '123456');
}

describe('CadastroScreen', () => {
  afterEach(() => jest.clearAllMocks());

  it('shows a validation error when passwords do not match', async () => {
    (useAuth as jest.Mock).mockReturnValue({ register: jest.fn() });
    renderScreen();

    fillValidForm();
    fireEvent.changeText(screen.getByTestId('cadastro-confirmPassword-input'), 'different');
    fireEvent.press(screen.getByTestId('cadastro-submit'));

    await waitFor(() => expect(screen.getByText('As senhas não coincidem')).toBeTruthy());
  });

  it('calls useAuth().register with the typed data on valid submit', async () => {
    const register = jest.fn().mockResolvedValue(undefined);
    (useAuth as jest.Mock).mockReturnValue({ register });
    renderScreen();

    fillValidForm();
    fireEvent.press(screen.getByTestId('cadastro-submit'));

    await waitFor(() =>
      expect(register).toHaveBeenCalledWith('testuser', 'test@example.com', '123456')
    );
  });

  it('maps a duplicate-email API error onto the email field', async () => {
    const register = jest
      .fn()
      .mockRejectedValue(new ApiValidationError('Erro de validação', { email: ['E-mail já cadastrado.'] }));
    (useAuth as jest.Mock).mockReturnValue({ register });
    renderScreen();

    fillValidForm();
    fireEvent.press(screen.getByTestId('cadastro-submit'));

    await waitFor(() => expect(screen.getByText('E-mail já cadastrado.')).toBeTruthy());
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npm test -- CadastroScreen.test.tsx`
Expected: FAIL — current `CadastroScreen` has none of these test IDs/behavior yet.

- [ ] **Step 7: Implement the screen**

```tsx
// src/screens/auth/CadastroScreen.tsx
import { useState } from 'react';
import { Text, Pressable, StyleSheet } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/AuthStack';
import { GradientBackground } from '../../components/GradientBackground';
import { TextField } from '../../components/TextField';
import { Button } from '../../components/Button';
import { useAuth } from '../../auth/AuthContext';
import { ApiValidationError } from '../../api/auth';
import { colors, fonts } from '../../theme';
import { cadastroSchema, type CadastroFormValues } from './CadastroScreen.schema';

type Props = NativeStackScreenProps<AuthStackParamList, 'Cadastro'>;

export function CadastroScreen({ navigation }: Props) {
  const { register } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CadastroFormValues>({
    resolver: zodResolver(cadastroSchema),
    defaultValues: { username: '', email: '', password: '', confirmPassword: '' },
  });

  async function onSubmit(values: CadastroFormValues) {
    setSubmitError(null);
    try {
      await register(values.username, values.email, values.password);
    } catch (error) {
      if (error instanceof ApiValidationError) {
        Object.entries(error.errors).forEach(([field, messages]) => {
          if (field === 'username' || field === 'email' || field === 'password') {
            setError(field, { message: messages[0] });
          }
        });
        return;
      }
      setSubmitError(error instanceof Error ? error.message : 'Não foi possível cadastrar.');
    }
  }

  return (
    <GradientBackground style={styles.container}>
      <Text style={styles.title}>Cadastro</Text>

      <Controller
        control={control}
        name="username"
        render={({ field }) => (
          <TextField
            label="Nome de usuário"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.username?.message}
            testID="cadastro-username"
          />
        )}
      />

      <Controller
        control={control}
        name="email"
        render={({ field }) => (
          <TextField
            label="Email"
            icon="mail"
            keyboardType="email-address"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.email?.message}
            testID="cadastro-email"
          />
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field }) => (
          <TextField
            label="Senha"
            icon="lock"
            secureTextEntry
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.password?.message}
            testID="cadastro-password"
          />
        )}
      />

      <Controller
        control={control}
        name="confirmPassword"
        render={({ field }) => (
          <TextField
            label="Confirmar senha"
            icon="lock"
            secureTextEntry
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.confirmPassword?.message}
            testID="cadastro-confirmPassword"
          />
        )}
      />

      {submitError && <Text style={styles.error}>{submitError}</Text>}

      <Button
        label="Cadastrar"
        loading={isSubmitting}
        onPress={handleSubmit(onSubmit)}
        testID="cadastro-submit"
      />

      <Pressable testID="go-to-login" onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Já tem conta? Entrar</Text>
      </Pressable>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  title: { fontFamily: fonts.inter.extraBold, fontSize: 36, color: colors.navy },
  error: { fontFamily: fonts.inter.medium, fontSize: 14, color: '#E53935' },
  link: { fontFamily: fonts.inter.medium, fontSize: 14, color: '#fff' },
});
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npm test -- CadastroScreen.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 9: Run the full suite**

Run: `npm test`
Expected: PASS. `AuthStack.test.tsx` navigates Login → Cadastro and asserts on the text "Cadastro", which the real screen's title still renders, so it keeps passing.

- [ ] **Step 10: Commit**

```bash
git add src/screens/auth/CadastroScreen.tsx src/screens/auth/CadastroScreen.schema.ts src/screens/auth/CadastroScreen.schema.test.ts src/screens/auth/CadastroScreen.test.tsx
git commit -m "Implement CadastroScreen with validated form and API error mapping"
```

---

## Task 14: HomeScreen (full implementation)

**Files:**
- Modify: `src/screens/home/HomeScreen.tsx`
- Test: `src/screens/home/HomeScreen.test.tsx`

**Interfaces:**
- Consumes: `useAuth` (Task 5 — `user`, `logout`), `Button` (Task 8).

- [ ] **Step 1: Write the failing test**

```tsx
// src/screens/home/HomeScreen.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { HomeScreen } from './HomeScreen';
import { useAuth } from '../../auth/AuthContext';

jest.mock('../../auth/AuthContext');

describe('HomeScreen', () => {
  afterEach(() => jest.clearAllMocks());

  it('greets the logged-in user by name', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 1, name: 'testuser', email: 'test@example.com', role: 'cidadao', createdAt: '2026-01-01' },
      logout: jest.fn(),
    });

    render(<HomeScreen />);
    expect(screen.getByText(/testuser/)).toBeTruthy();
  });

  it('calls logout() when the logout button is pressed', async () => {
    const logout = jest.fn().mockResolvedValue(undefined);
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 1, name: 'testuser', email: 'test@example.com', role: 'cidadao', createdAt: '2026-01-01' },
      logout,
    });

    render(<HomeScreen />);
    fireEvent.press(screen.getByTestId('home-logout'));

    await waitFor(() => expect(logout).toHaveBeenCalledTimes(1));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- HomeScreen.test.tsx`
Expected: FAIL — current `HomeScreen` renders neither the greeting nor a logout button.

- [ ] **Step 3: Implement**

```tsx
// src/screens/home/HomeScreen.tsx
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../auth/AuthContext';
import { Button } from '../../components/Button';
import { colors, fonts } from '../../theme';

export function HomeScreen() {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 24 }]}>
      <Text style={styles.greeting}>Olá, {user?.name ?? 'visitante'}!</Text>
      <Text style={styles.subtitle}>Bem-vindo(a) de volta ao ResolveAí.</Text>
      <Button label="Sair" variant="secondary" onPress={() => logout()} testID="home-logout" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', paddingHorizontal: 24, gap: 16 },
  greeting: { fontFamily: fonts.inter.extraBold, fontSize: 24, color: colors.navy },
  subtitle: { fontFamily: fonts.inter.regular, fontSize: 16, color: '#90A4AE', marginBottom: 24 },
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- HomeScreen.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Run the full suite**

Run: `npm test`
Expected: PASS. `AppTabs.test.tsx` and `RootNavigator.test.tsx` assert on the text "Início", which is the tab's `title` option, not this screen's content, so they are unaffected.

- [ ] **Step 6: Commit**

```bash
git add src/screens/home/HomeScreen.tsx src/screens/home/HomeScreen.test.tsx
git commit -m "Implement HomeScreen with user greeting and logout"
```

---

## Task 15: Documentation + final verification

**Files:**
- Modify: `README.md`
- Create: `docs/auth-flow.md`

**Interfaces:** none (documentation + verification only).

- [ ] **Step 1: Fill in the README's "a definir" sections**

In the "Tecnologias Utilizadas" section of `README.md`, replace:

```markdown
* **Navegação:** a definir (ex.: Expo Router / React Navigation)
* **Estilização:** a definir
* **Gerenciamento de Estado:** a definir
```

with:

```markdown
* **Navegação:** React Navigation (`native-stack` para Login/Cadastro, `bottom-tabs` para a área logada)
* **Estilização:** StyleSheet do React Native + tokens em `src/theme` (cores e tipografia extraídos do Figma)
* **Gerenciamento de Estado:** Context API (`src/auth/AuthContext.tsx`) para a sessão do usuário; sem lib de estado global além disso por enquanto
```

Also update the folder structure note in section 4 to add the folders created in this delivery:

```markdown
* `/src/api`: Cliente HTTP (Axios) e chamadas à API de autenticação
* `/src/auth`: Estado global de sessão (Context) e armazenamento seguro de tokens
* `/src/components`: Componentes reutilizáveis de UI (Button, TextField, Icon, Loading, GradientBackground)
* `/src/navigation`: Árvore de navegação (Loading, Auth, Tabs)
* `/src/screens`: Telas do aplicativo
* `/src/theme`: Cores e tipografia
```

- [ ] **Step 2: Write the auth flow doc**

```markdown
<!-- docs/auth-flow.md -->
# Fluxo de autenticação

## Boot do app

1. `AuthProvider` monta com `status = 'bootstrapping'` (tela de Loading visível).
2. Lê tokens do `expo-secure-store` (`src/auth/storage.ts`).
3. Sem token → `status = 'guest'` (vai para Login/Cadastro).
4. Com token → chama `GET /auth/me`. Sucesso → `status = 'authenticated'`. Falha → limpa
   tokens e cai para `guest`.

## Login / Cadastro

- `LoginScreen` e `CadastroScreen` chamam `useAuth().login()` / `useAuth().register()`.
- Cadastro bem-sucedido loga automaticamente (chama `login()` internamente) — não existe
  uma segunda tela de "cadastro concluído, agora faça login".
- Erros 400 de validação da API (ex.: e-mail duplicado) chegam como `ApiValidationError`
  e são mapeados para o campo correspondente do formulário; outros erros aparecem como
  banner genérico abaixo dos campos.

## Renovação automática de token (refresh)

- Toda chamada autenticada passa pelo `apiClient` (`src/api/client.ts`), que injeta
  `Authorization: Bearer <access_token>` via interceptor de request.
- Em qualquer resposta 401, o interceptor de response chama `POST /auth/refresh` **uma
  única vez** (flag `_retry` evita loop), usando o refresh token salvo. Se funcionar,
  salva os novos tokens (o backend rotaciona o refresh token a cada uso) e repete a
  requisição original.
- Se o refresh falhar (token expirado/inválido/já usado), os tokens são apagados do
  SecureStore e `AuthContext` é notificado via `setOnRefreshFailure` — o app volta pro
  fluxo de Login em qualquer tela, não só no boot.

## Logout

- `useAuth().logout()` chama `GET /auth/logout` (ignora falha de rede — o logout local
  acontece de todo modo), limpa o SecureStore e volta `status` para `guest`.
```

- [ ] **Step 3: Run the full test suite**

Run: `npm test`
Expected: PASS (every suite from Tasks 1–14).

- [ ] **Step 4: Type-check the project**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Bundle sanity check**

Run: `npx expo export --platform ios --output-dir <temp-dir>` (use a scratch directory,
then delete it afterwards — this mirrors the check already used for the theme delivery).
Expected: bundles successfully, no unresolved-module errors.

- [ ] **Step 6: Commit**

```bash
git add README.md docs/auth-flow.md
git commit -m "Document navigation/state decisions and the auth/refresh flow"
```

---

## Self-Review Notes

- **Spec coverage:** navigation (Task 11), global auth state with refresh (Tasks 2–5),
  loading screen (Task 11), validated reusable components (Tasks 6–10), tab navigator
  after login (Task 11), cadastro screen (Task 13), login screen (Task 12), tests for
  every field/screen (each task's own test file), documentation (Task 15). No spec
  section is left without a task.
- **Type consistency:** `AuthUser`, `AuthTokensResponse`, `LoginResponse` (Task 4) are
  the only shapes referenced by `AuthContext` (Task 5) and the screens (Tasks 12–14);
  `IconName` (Task 6) is the only type accepted by `TextField`'s `icon` prop (Task 10)
  and `AppTabs`' `TAB_ICONS` map (Task 11) — no ad-hoc string literals for icon names
  appear elsewhere.
- **Out of scope, confirmed with the spec:** Mapa/Demandas/Perfil real content, password
  recovery, avatar upload — all left as-is (placeholders / not started).
