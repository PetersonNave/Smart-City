import { create } from 'zustand';
import { atualizarStatusDemanda, excluirDemanda, listarDemandas, obterDemanda } from '../api/demandas';
import { isNetworkError } from '../api/envelope';
import { CACHE_KEYS, readCache, writeCache } from '../storage/cache';
import type { Demanda, DemandaCategoria, DemandaRegiao, DemandaStatus, ListarDemandasParams } from '../types';

export const DEMANDAS_PER_PAGE = 10;

/** Filtros da lista, aplicados no backend (`GET /api/demandas`). `undefined` = sem filtro. */
export type DemandaFiltros = {
  q?: string;
  status?: DemandaStatus;
  categoria?: DemandaCategoria;
  regiao?: DemandaRegiao;
};

/**
 * Chamado quando dados vindos da API mostram que o status de uma demanda já conhecida mudou
 * (ex.: o gestor atualizou enquanto o cidadão acompanhava). Mudanças feitas pelo próprio
 * usuário neste aparelho (`changeStatus`, `upsert`) não disparam.
 */
export type StatusChangeListener = (demanda: Demanda, statusAnterior: DemandaStatus) => void;

let statusChangeListener: StatusChangeListener | null = null;

export function setStatusChangeListener(listener: StatusChangeListener | null) {
  statusChangeListener = listener;
}

function reportStatusChanges(previous: Record<number, Demanda>, incoming: Demanda[]) {
  if (!statusChangeListener) return;
  incoming.forEach((demanda) => {
    const before = previous[demanda.id];
    if (before && before.status !== demanda.status) statusChangeListener?.(demanda, before.status);
  });
}

export type DemandListStatus = 'loading' | 'ready' | 'error';

type DemandStoreState = {
  /** Página(s) carregadas da lista, na ordem da API, para os filtros atuais. */
  items: Demanda[];
  /** Última versão conhecida de cada demanda (lista, detalhe, edição, mudança de status). */
  byId: Record<number, Demanda>;
  filters: DemandaFiltros;
  listStatus: DemandListStatus;
  listError: string | null;
  page: number;
  hasNextPage: boolean;
  isLoadingMore: boolean;
  /** Recarregando por mudança de filtro com a lista já exibida (indicador discreto). */
  isFiltering: boolean;
  hasLoadedOnce: boolean;
  /** A tela está mostrando dados do cache local porque a API não respondeu (sem conexão). */
  isOffline: boolean;
  /** Quando os dados offline exibidos foram salvos (ISO), para o aviso na tela. */
  offlineSavedAt: string | null;
};

type DemandStoreActions = {
  setFilters: (filters: Partial<DemandaFiltros>) => void;
  clearFilters: () => void;
  loadFirstPage: () => Promise<void>;
  retryFirstLoad: () => Promise<void>;
  loadMore: () => Promise<void>;
  /**
   * Busca uma demanda na API e atualiza o cache e a lista. `notify: false` não avisa o
   * listener de status (ex.: a atualização veio de uma notificação push já exibida).
   */
  fetchOne: (id: number, options?: { notify?: boolean }) => Promise<Demanda>;
  /** Registra a versão mais recente de uma demanda (substitui na lista, se estiver nela). */
  upsert: (demanda: Demanda) => void;
  remove: (id: number) => Promise<void>;
  /** Gestor: altera o status (`PATCH /api/demandas/:id`). */
  changeStatus: (id: number, status: DemandaStatus) => Promise<Demanda>;
  clearListError: () => void;
  setListError: (message: string | null) => void;
  /** Volta ao estado inicial (logout e testes). */
  reset: () => void;
};

export type DemandStore = DemandStoreState & DemandStoreActions;

const INITIAL_STATE: DemandStoreState = {
  items: [],
  byId: {},
  filters: {},
  listStatus: 'loading',
  listError: null,
  page: 1,
  hasNextPage: false,
  isLoadingMore: false,
  isFiltering: false,
  hasLoadedOnce: false,
  isOffline: false,
  offlineSavedAt: null,
};

/** Primeira página salva no AsyncStorage (só a lista sem filtros, que é a tela inicial). */
type CachedLista = { items: Demanda[]; hasNextPage: boolean };

function hasActiveFilters(filters: DemandaFiltros) {
  return Boolean(filters.q || filters.status || filters.categoria || filters.regiao);
}

function normalize(text: string) {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

/** Offline, os filtros são aplicados localmente sobre o que estiver em cache. */
function applyFiltersLocally(demandas: Demanda[], filters: DemandaFiltros) {
  const q = filters.q ? normalize(filters.q) : null;
  return demandas.filter(
    (demanda) =>
      (!filters.status || demanda.status === filters.status) &&
      (!filters.categoria || demanda.category === filters.categoria) &&
      (!filters.regiao || demanda.region === filters.regiao) &&
      (!q || normalize(`${demanda.title} ${demanda.description} ${demanda.location}`).includes(q))
  );
}

function persistById(byId: Record<number, Demanda>) {
  void writeCache(CACHE_KEYS.demandasPorId, byId);
}

// Cada carga da primeira página ganha um número; respostas de buscas antigas que chegarem
// depois (ex.: o usuário trocou o filtro no meio) são descartadas.
let requestSeq = 0;

function toApiParams(filters: DemandaFiltros): ListarDemandasParams {
  const params: ListarDemandasParams = {};
  if (filters.q) params.q = filters.q;
  if (filters.status) params.status = filters.status;
  if (filters.categoria) params.categoria = filters.categoria;
  if (filters.regiao) params.regiao = filters.regiao;
  return params;
}

function indexById(current: Record<number, Demanda>, demandas: Demanda[]) {
  const next = { ...current };
  demandas.forEach((demanda) => {
    next[demanda.id] = demanda;
  });
  return next;
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export const useDemandStore = create<DemandStore>()((set, get) => ({
  ...INITIAL_STATE,

  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
  clearFilters: () => set({ filters: {} }),

  loadFirstPage: async () => {
    const seq = ++requestSeq;
    set({ isFiltering: get().hasLoadedOnce });
    try {
      const result = await listarDemandas({ ...toApiParams(get().filters), page: 1, per_page: DEMANDAS_PER_PAGE });
      if (seq !== requestSeq) return;
      reportStatusChanges(get().byId, result.demandas);
      set((state) => ({
        items: result.demandas,
        byId: indexById(state.byId, result.demandas),
        page: 1,
        hasNextPage: result.paginacao.tem_proxima,
        listError: null,
        listStatus: 'ready',
        hasLoadedOnce: true,
        isOffline: false,
        offlineSavedAt: null,
      }));
      if (!hasActiveFilters(get().filters)) {
        void writeCache<CachedLista>(CACHE_KEYS.demandasLista, {
          items: result.demandas,
          hasNextPage: result.paginacao.tem_proxima,
        });
      }
      persistById(get().byId);
    } catch (error) {
      if (seq !== requestSeq) return;
      if (isNetworkError(error)) {
        const [lista, porId] = await Promise.all([
          readCache<CachedLista>(CACHE_KEYS.demandasLista),
          readCache<Record<number, Demanda>>(CACHE_KEYS.demandasPorId),
        ]);
        if (seq !== requestSeq) return;
        if (lista || porId) {
          // Junta a lista salva com as demandas abertas depois, sem repetir ids.
          const cached = [...(lista?.value.items ?? [])];
          const known = new Set(cached.map((item) => item.id));
          Object.values(porId?.value ?? {}).forEach((item) => {
            if (!known.has(item.id)) cached.push(item);
          });
          set((state) => ({
            items: applyFiltersLocally(cached, state.filters),
            byId: { ...(porId?.value ?? {}), ...state.byId },
            page: 1,
            hasNextPage: false,
            listError: null,
            listStatus: 'ready',
            hasLoadedOnce: true,
            isOffline: true,
            offlineSavedAt: lista?.savedAt ?? porId?.savedAt ?? null,
          }));
          return;
        }
      }
      // Numa atualização em segundo plano, mantém a lista antiga visível (erro vira aviso em linha).
      set((state) => ({
        listError: errorMessage(error, 'Não foi possível carregar as demandas.'),
        listStatus: state.hasLoadedOnce ? state.listStatus : 'error',
      }));
    } finally {
      if (seq === requestSeq) set({ isFiltering: false });
    }
  },

  retryFirstLoad: () => {
    set({ listStatus: 'loading' });
    return get().loadFirstPage();
  },

  loadMore: async () => {
    const { hasNextPage, isLoadingMore, listStatus, page, filters } = get();
    if (!hasNextPage || isLoadingMore || listStatus !== 'ready') return;
    set({ isLoadingMore: true });
    const seq = requestSeq;
    try {
      const nextPage = page + 1;
      const result = await listarDemandas({ ...toApiParams(filters), page: nextPage, per_page: DEMANDAS_PER_PAGE });
      if (seq !== requestSeq) return;
      reportStatusChanges(get().byId, result.demandas);
      set((state) => {
        const known = new Set(state.items.map((item) => item.id));
        return {
          items: [...state.items, ...result.demandas.filter((item) => !known.has(item.id))],
          byId: indexById(state.byId, result.demandas),
          page: nextPage,
          hasNextPage: result.paginacao.tem_proxima,
        };
      });
    } catch {
      // Falha ao paginar não derruba a lista; o usuário pode rolar de novo para tentar.
    } finally {
      set({ isLoadingMore: false });
    }
  },

  fetchOne: async (id, options) => {
    try {
      const demanda = await obterDemanda(id);
      if (options?.notify !== false) reportStatusChanges(get().byId, [demanda]);
      get().upsert(demanda);
      set({ isOffline: false, offlineSavedAt: null });
      return demanda;
    } catch (error) {
      // Sem conexão: devolve a última versão conhecida (memória ou AsyncStorage), se houver.
      if (!isNetworkError(error)) throw error;
      const inMemory = get().byId[id];
      const cached = inMemory ? null : await readCache<Record<number, Demanda>>(CACHE_KEYS.demandasPorId);
      const demanda = inMemory ?? cached?.value[id];
      if (!demanda) throw error;
      set((state) => ({
        byId: { ...state.byId, [id]: demanda },
        isOffline: true,
        offlineSavedAt: cached?.savedAt ?? state.offlineSavedAt,
      }));
      return demanda;
    }
  },

  upsert: (demanda) => {
    if (!demanda) return;
    set((state) => ({
      byId: { ...state.byId, [demanda.id]: demanda },
      items: state.items.map((item) => (item.id === demanda.id ? demanda : item)),
    }));
    persistById(get().byId);
  },

  remove: async (id) => {
    await excluirDemanda(id);
    set((state) => {
      const byId = { ...state.byId };
      delete byId[id];
      return { byId, items: state.items.filter((item) => item.id !== id) };
    });
    persistById(get().byId);
  },

  changeStatus: async (id, status) => {
    const demanda = await atualizarStatusDemanda(id, status);
    get().upsert(demanda);
    return demanda;
  },

  clearListError: () => set({ listError: null }),
  setListError: (message) => set({ listError: message }),

  reset: () => {
    requestSeq += 1;
    set({ ...INITIAL_STATE });
  },
}));
