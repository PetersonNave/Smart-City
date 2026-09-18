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
