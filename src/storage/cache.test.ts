import AsyncStorage from '@react-native-async-storage/async-storage';
import { CACHE_KEYS, clearCache, readCache, writeCache } from './cache';

describe('cache local (AsyncStorage)', () => {
  it('salva e lê o valor com a data em que foi salvo', async () => {
    await writeCache(CACHE_KEYS.sessionUser, { id: 1, name: 'Ana' });

    const entry = await readCache<{ id: number; name: string }>(CACHE_KEYS.sessionUser);

    expect(entry?.value).toEqual({ id: 1, name: 'Ana' });
    expect(Number.isNaN(Date.parse(entry!.savedAt))).toBe(false);
  });

  it('retorna null quando não há nada salvo ou o JSON está corrompido', async () => {
    expect(await readCache(CACHE_KEYS.demandasLista)).toBeNull();

    await AsyncStorage.setItem('resolveai.cache.demandas.lista', '{quebrado');
    expect(await readCache(CACHE_KEYS.demandasLista)).toBeNull();
  });

  it('clearCache remove só as chaves do app', async () => {
    await writeCache(CACHE_KEYS.demandasPorId, { 1: { id: 1 } });
    await AsyncStorage.setItem('outra-lib', 'x');

    await clearCache();

    expect(await readCache(CACHE_KEYS.demandasPorId)).toBeNull();
    expect(await AsyncStorage.getItem('outra-lib')).toBe('x');
  });
});
