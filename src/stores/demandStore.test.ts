import {
  atualizarStatusDemanda,
  excluirDemanda,
  listarDemandas,
  obterDemanda,
  type Demanda,
} from '../api/demandas';
import { setStatusChangeListener, useDemandStore } from './demandStore';

jest.mock('../api/demandas');

function makeDemanda(overrides: Partial<Demanda> = {}): Demanda {
  return {
    id: 1,
    title: 'Semáforo danificado',
    description: 'Semáforo apagado há três dias.',
    category: 'PUBLIC_LIGHTING',
    location: 'Rua XV de Novembro, 450',
    status: 'PENDING',
    priority: 'media',
    createdAt: '2026-10-15T12:00:00',
    updatedAt: null,
    photoUrl: null,
    ...overrides,
  };
}

const paginacao = { total: 1, paginas: 1, pagina_atual: 1, por_pagina: 10, tem_proxima: false, tem_anterior: false };

describe('demandStore', () => {
  afterEach(async () => jest.clearAllMocks());

  it('loads the first page with the current filters sent to the API', async () => {
    (listarDemandas as jest.Mock).mockResolvedValue({ demandas: [makeDemanda()], paginacao });
    useDemandStore.getState().setFilters({ q: 'semaforo', status: 'PENDING', categoria: 'PUBLIC_LIGHTING' });

    await useDemandStore.getState().loadFirstPage();

    expect(listarDemandas).toHaveBeenCalledWith({
      q: 'semaforo',
      status: 'PENDING',
      categoria: 'PUBLIC_LIGHTING',
      page: 1,
      per_page: 10,
    });
    const state = useDemandStore.getState();
    expect(state.listStatus).toBe('ready');
    expect(state.items).toHaveLength(1);
    expect(state.byId[1].title).toBe('Semáforo danificado');
  });

  it('ignores a stale response that arrives after a newer load', async () => {
    let resolveOld: (value: unknown) => void = () => {};
    (listarDemandas as jest.Mock)
      .mockReturnValueOnce(new Promise((resolve) => (resolveOld = resolve)))
      .mockResolvedValueOnce({ demandas: [makeDemanda({ id: 2, title: 'Novo' })], paginacao });

    const old = useDemandStore.getState().loadFirstPage();
    await useDemandStore.getState().loadFirstPage();
    resolveOld({ demandas: [makeDemanda({ id: 1, title: 'Antigo' })], paginacao });
    await old;

    expect(useDemandStore.getState().items.map((item) => item.title)).toEqual(['Novo']);
  });

  it('keeps the list and the cache in sync when a demand changes elsewhere', async () => {
    (listarDemandas as jest.Mock).mockResolvedValue({ demandas: [makeDemanda()], paginacao });
    await useDemandStore.getState().loadFirstPage();
    (atualizarStatusDemanda as jest.Mock).mockResolvedValue(makeDemanda({ status: 'IN_PROGRESS' }));

    await useDemandStore.getState().changeStatus(1, 'IN_PROGRESS');

    expect(atualizarStatusDemanda).toHaveBeenCalledWith(1, 'IN_PROGRESS');
    expect(useDemandStore.getState().items[0].status).toBe('IN_PROGRESS');
    expect(useDemandStore.getState().byId[1].status).toBe('IN_PROGRESS');
  });

  it('fetchOne caches the demand and remove drops it', async () => {
    (obterDemanda as jest.Mock).mockResolvedValue(makeDemanda({ id: 7 }));
    (excluirDemanda as jest.Mock).mockResolvedValue(undefined);

    await useDemandStore.getState().fetchOne(7);
    expect(useDemandStore.getState().byId[7]).toBeDefined();

    await useDemandStore.getState().remove(7);
    expect(useDemandStore.getState().byId[7]).toBeUndefined();
  });

  it('marks the first load as error but keeps a loaded list on later failures', async () => {
    (listarDemandas as jest.Mock).mockRejectedValueOnce(new Error('Sem conexão'));
    await useDemandStore.getState().loadFirstPage();
    expect(useDemandStore.getState().listStatus).toBe('error');

    (listarDemandas as jest.Mock).mockResolvedValueOnce({ demandas: [makeDemanda()], paginacao });
    await useDemandStore.getState().retryFirstLoad();
    (listarDemandas as jest.Mock).mockRejectedValueOnce(new Error('Oscilou'));
    await useDemandStore.getState().loadFirstPage();

    expect(useDemandStore.getState().listStatus).toBe('ready');
    expect(useDemandStore.getState().listError).toBe('Oscilou');
    expect(useDemandStore.getState().items).toHaveLength(1);
  });

  it('sends the region filter to the API', async () => {
    (listarDemandas as jest.Mock).mockResolvedValue({ demandas: [], paginacao });
    useDemandStore.getState().setFilters({ regiao: 'NORTE', categoria: 'SANITATION' });

    await useDemandStore.getState().loadFirstPage();

    expect(listarDemandas).toHaveBeenCalledWith({ regiao: 'NORTE', categoria: 'SANITATION', page: 1, per_page: 10 });
  });

  describe('status change listener', () => {
    const listener = jest.fn();
    beforeEach(async () => setStatusChangeListener(listener));
    afterEach(async () => setStatusChangeListener(null));

    it('reports a status that changed on the server since the last load', async () => {
      (listarDemandas as jest.Mock).mockResolvedValueOnce({ demandas: [makeDemanda()], paginacao });
      await useDemandStore.getState().loadFirstPage();
      (listarDemandas as jest.Mock).mockResolvedValueOnce({
        demandas: [makeDemanda({ status: 'IN_PROGRESS' })],
        paginacao,
      });

      await useDemandStore.getState().loadFirstPage();

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({ id: 1, status: 'IN_PROGRESS' }), 'PENDING');
    });

    it('does not report the first load, local changes or silent refreshes', async () => {
      (listarDemandas as jest.Mock).mockResolvedValue({ demandas: [makeDemanda()], paginacao });
      await useDemandStore.getState().loadFirstPage();
      (atualizarStatusDemanda as jest.Mock).mockResolvedValue(makeDemanda({ status: 'IN_PROGRESS' }));
      await useDemandStore.getState().changeStatus(1, 'IN_PROGRESS');
      (obterDemanda as jest.Mock).mockResolvedValue(makeDemanda({ status: 'RESOLVED' }));
      await useDemandStore.getState().fetchOne(1, { notify: false });

      expect(listener).not.toHaveBeenCalled();
    });
  });

  it('reset clears everything from the previous session', async () => {
    (listarDemandas as jest.Mock).mockResolvedValue({ demandas: [makeDemanda()], paginacao });
    useDemandStore.getState().setFilters({ q: 'x' });
    await useDemandStore.getState().loadFirstPage();

    useDemandStore.getState().reset();

    const state = useDemandStore.getState();
    expect(state.items).toEqual([]);
    expect(state.byId).toEqual({});
    expect(state.filters).toEqual({});
    expect(state.hasLoadedOnce).toBe(false);
  });
});
