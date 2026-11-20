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
import { isNetworkError } from '../api/envelope';
import { useDemandStore } from '../stores/demandStore';
import { CACHE_KEYS, clearCache, readCache, writeCache } from '../storage/cache';

// Ao trocar de sessão, nada da conta anterior pode continuar em cache (demandas, filtros),
// nem na memória nem no AsyncStorage.
async function clearSessionData() {
  useDemandStore.getState().reset();
  await clearCache();
}

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
        await writeCache(CACHE_KEYS.sessionUser, me);
        if (isMounted) {
          setUser(me);
          setStatus('authenticated');
        }
      } catch (error) {
        // Sem conexão a sessão é preservada com o último usuário salvo: o app abre com os
        // dados em cache e as chamadas voltam a funcionar (com refresh de token) quando a rede voltar.
        if (isNetworkError(error)) {
          const cached = await readCache<AuthUser>(CACHE_KEYS.sessionUser);
          if (cached) {
            if (isMounted) {
              setUser(cached.value);
              setStatus('authenticated');
            }
            return;
          }
        }
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
      void clearSessionData();
      setUser(null);
      setStatus('guest');
    });
    return () => setOnRefreshFailure(null);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await apiLogin({ email, password });
    await setStoredTokens({ accessToken: result.access_token, refreshToken: result.refresh_token });
    await clearSessionData();
    await writeCache(CACHE_KEYS.sessionUser, result.user);
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
    await clearSessionData();
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
