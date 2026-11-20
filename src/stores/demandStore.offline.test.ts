import { listarDemandas, obterDemanda, type Demanda } from '../api/demandas';
import { NetworkError } from '../api/envelope';
import { CACHE_KEYS, readCache } from '../storage/cache';
import { useDemandStore } from './demandStore';

jest.mock('../api/demandas', () => ({
  ...jest.requireActual('../api/demandas'),
  listarDemandas: jest.fn(),
  obterDemanda: jest.fn(),
}));

const listarMock = listarDemandas as jest.MockedFunction<typeof listarDemandas>;
const obterMock = obterDemanda as jest.MockedFunction<typeof obterDemanda>;

function demanda(id: number, overrides: Partial<Demanda> = {}): Demanda {
  return {
    id,
    title: `Buraco ${id}`,
    description: 'Na rua principal',
    category: 'ROAD_MAINTENANCE',
    location: 'Rua A',
    status: 'PENDING',
    priority: 'media',
    createdAt: '2026-11-01T10:00:00',
    updatedAt: null,
    photoUrl: null,
    region: 'CENTRO',
    ...overrides,
  };
}

const paginacao = { total: 2, paginas: 1, pagina_atual: 1, por_pagina: 10, tem_proxima: false, tem_anterior: false };

async function flush() {
  // writeCache roda em segundo plano (void); deixa as promessas pendentes terminarem.
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe('demandStore offline', () => {
  beforeEach(() => {
    listarMock.mockReset();
    obterMock.mockReset();
  });

  it('salva a primeira página sem filtros no cache', async () => {
    listarMock.mockResolvedValueOnce({ demandas: [demanda(1), demanda(2)], paginacao });

    await useDemandStore.getState().loadFirstPage();
    await flush();

    const cached = await readCache<{ items: Demanda[] }>(CACHE_KEYS.demandasLista);
    expect(cached?.value.items.map((item) => item.id)).toEqual([1, 2]);
    expect(useDemandStore.getState().isOffline).toBe(false);
  });

  it('sem conexão, mostra as demandas salvas e marca como offline', async () => {
    listarMock.mockResolvedValueOnce({ demandas: [demanda(1), demanda(2)], paginacao });
    await useDemandStore.getState().loadFirstPage();
    await flush();
    useDemandStore.getState().reset();

    listarMock.mockRejectedValueOnce(new NetworkError());
    await useDemandStore.getState().loadFirstPage();

    const state = useDemandStore.getState();
    expect(state.listStatus).toBe('ready');
    expect(state.isOffline).toBe(true);
    expect(state.offlineSavedAt).not.toBeNull();
    expect(state.items.map((item) => item.id)).toEqual([1, 2]);
  });

  it('offline, aplica os filtros localmente sobre o cache', async () => {
    listarMock.mockResolvedValueOnce({
      demandas: [demanda(1), demanda(2, { status: 'RESOLVED', title: 'Poste apagado' })],
      paginacao,
    });
    await useDemandStore.getState().loadFirstPage();
    await flush();
    useDemandStore.getState().reset();

    useDemandStore.getState().setFilters({ q: 'poste' });
    listarMock.mockRejectedValueOnce(new NetworkError());
    await useDemandStore.getState().loadFirstPage();

    expect(useDemandStore.getState().items.map((item) => item.id)).toEqual([2]);
  });

  it('sem conexão e sem cache, continua mostrando o erro', async () => {
    listarMock.mockRejectedValueOnce(new NetworkError());

    await useDemandStore.getState().loadFirstPage();

    const state = useDemandStore.getState();
    expect(state.listStatus).toBe('error');
    expect(state.isOffline).toBe(false);
  });

  it('erro da API (não de rede) não usa o cache', async () => {
    listarMock.mockResolvedValueOnce({ demandas: [demanda(1)], paginacao });
    await useDemandStore.getState().loadFirstPage();
    await flush();
    useDemandStore.getState().reset();

    listarMock.mockRejectedValueOnce(new Error('Erro interno'));
    await useDemandStore.getState().loadFirstPage();

    expect(useDemandStore.getState().listStatus).toBe('error');
    expect(useDemandStore.getState().listError).toBe('Erro interno');
  });

  it('fetchOne devolve a demanda salva quando está offline', async () => {
    obterMock.mockResolvedValueOnce(demanda(7));
    await useDemandStore.getState().fetchOne(7);
    await flush();
    useDemandStore.getState().reset();

    obterMock.mockRejectedValueOnce(new NetworkError());
    const result = await useDemandStore.getState().fetchOne(7);

    expect(result.id).toBe(7);
    expect(useDemandStore.getState().isOffline).toBe(true);
  });

  it('fetchOne sem cache repassa o erro de rede', async () => {
    obterMock.mockRejectedValueOnce(new NetworkError());

    await expect(useDemandStore.getState().fetchOne(99)).rejects.toBeInstanceOf(NetworkError);
  });
});
