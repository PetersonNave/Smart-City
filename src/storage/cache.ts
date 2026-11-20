import AsyncStorage from '@react-native-async-storage/async-storage';

// Cache local (AsyncStorage) para o app continuar útil sem conexão: sessão do usuário e
// demandas já consultadas. Tokens continuam no SecureStore (src/auth/storage.ts).
const PREFIX = 'resolveai.cache.';

export const CACHE_KEYS = {
  /** Último usuário autenticado (GET /auth/me), para restaurar a sessão offline. */
  sessionUser: 'session.user',
  /** Primeira página da lista de demandas sem filtros. */
  demandasLista: 'demandas.lista',
  /** Última versão conhecida de cada demanda aberta/listada. */
  demandasPorId: 'demandas.porId',
} as const;

export type CacheKey = (typeof CACHE_KEYS)[keyof typeof CACHE_KEYS];

export type CacheEntry<T> = {
  /** ISO 8601 do momento em que foi salvo. */
  savedAt: string;
  value: T;
};

/** Lê uma entrada do cache. Falhas de leitura ou JSON corrompido viram `null` (cache é opcional). */
export async function readCache<T>(key: CacheKey): Promise<CacheEntry<T> | null> {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as CacheEntry<T>) : null;
  } catch {
    return null;
  }
}

export async function writeCache<T>(key: CacheKey, value: T): Promise<void> {
  try {
    const entry: CacheEntry<T> = { savedAt: new Date().toISOString(), value };
    await AsyncStorage.setItem(PREFIX + key, JSON.stringify(entry));
  } catch {
    // Sem espaço ou storage indisponível: o app segue funcionando online.
  }
}

/** Remove todo o cache do app (logout/troca de conta). */
export async function clearCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const ours = keys.filter((key) => key.startsWith(PREFIX));
    if (ours.length) await AsyncStorage.multiRemove(ours);
  } catch {
    // Ignora: na pior das hipóteses o próximo login sobrescreve as entradas.
  }
}
