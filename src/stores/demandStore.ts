import { create } from 'zustand';
import {
  atualizarStatusDemanda,
  excluirDemanda,
  listarDemandas,
  obterDemanda,
  type Demanda,
  type DemandaCategoria,
  type DemandaStatus,
  type ListarDemandasParams,
} from '../api/demandas';

export const DEMANDAS_PER_PAGE = 10;

/** Filtros da lista, aplicados no backend (`GET /api/demandas`). `undefined` = sem filtro. */
export type DemandaFiltros = {
  q?: string;
  status?: DemandaStatus;
  categoria?: DemandaCategoria;
};

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
};

type DemandStoreActions = {
  setFilters: (filters: Partial<DemandaFiltros>) => void;
  clearFilters: () => void;
  loadFirstPage: () => Promise<void>;
  retryFirstLoad: () => Promise<void>;
  loadMore: () => Promise<void>;
  /** Busca uma demanda na API e atualiza o cache e a lista. */
  fetchOne: (id: number) => Promise<Demanda>;
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
};

// Cada carga da primeira página ganha um número; respostas de buscas antigas que chegarem
// depois (ex.: o usuário trocou o filtro no meio) são descartadas.
let requestSeq = 0;

function toApiParams(filters: DemandaFiltros): ListarDemandasParams {
  const params: ListarDemandasParams = {};
  if (filters.q) params.q = filters.q;
  if (filters.status) params.status = filters.status;
  if (filters.categoria) params.categoria = filters.categoria;
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
      set((state) => ({
        items: result.demandas,
        byId: indexById(state.byId, result.demandas),
        page: 1,
        hasNextPage: result.paginacao.tem_proxima,
        listError: null,
        listStatus: 'ready',
        hasLoadedOnce: true,
      }));
    } catch (error) {
      if (seq !== requestSeq) return;
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

  fetchOne: async (id) => {
    const demanda = await obterDemanda(id);
    get().upsert(demanda);
    return demanda;
  },

  upsert: (demanda) => {
    if (!demanda) return;
    set((state) => ({
      byId: { ...state.byId, [demanda.id]: demanda },
      items: state.items.map((item) => (item.id === demanda.id ? demanda : item)),
    }));
  },

  remove: async (id) => {
    await excluirDemanda(id);
    set((state) => {
      const byId = { ...state.byId };
      delete byId[id];
      return { byId, items: state.items.filter((item) => item.id !== id) };
    });
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
