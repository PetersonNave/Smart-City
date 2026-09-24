import { apiClient } from './client';
import { criarDemanda, excluirDemanda, listarDemandas, obterDemanda } from './demandas';
import { ApiValidationError, NETWORK_ERROR_MESSAGE } from './envelope';

jest.mock('./client', () => ({
  apiClient: { get: jest.fn(), post: jest.fn(), delete: jest.fn() },
}));

const demanda = {
  id: 7,
  title: 'Semáforo danificado',
  description: 'Semáforo na esquina está apagado há 3 dias.',
  category: 'ROAD_MAINTENANCE',
  location: 'Rua XV de Novembro, 450',
  status: 'PENDING',
  priority: 'media',
  createdAt: '2026-10-15T13:20:00',
  updatedAt: null,
};

function envelope<T>(data: T, status_code = 200) {
  return { data: { data, message: '', status_code } };
}

describe('demandas api', () => {
  afterEach(() => jest.clearAllMocks());

  it('listarDemandas() forwards the query params and unwraps demandas + paginacao', async () => {
    const paginacao = { total: 1, paginas: 1, pagina_atual: 1, por_pagina: 10, tem_proxima: false, tem_anterior: false };
    (apiClient.get as jest.Mock).mockResolvedValue(envelope({ demandas: [demanda], paginacao }));

    const result = await listarDemandas({ page: 2, per_page: 10 });

    expect(apiClient.get).toHaveBeenCalledWith('/api/demandas', { params: { page: 2, per_page: 10 } });
    expect(result.demandas).toEqual([demanda]);
    expect(result.paginacao.total).toBe(1);
  });

  it('obterDemanda() gets /api/demandas/:id and unwraps the nested demanda', async () => {
    (apiClient.get as jest.Mock).mockResolvedValue(envelope({ demanda }));

    await expect(obterDemanda(7)).resolves.toEqual(demanda);
    expect(apiClient.get).toHaveBeenCalledWith('/api/demandas/7');
  });

  it('criarDemanda() posts the portuguese-keyed body the backend expects', async () => {
    (apiClient.post as jest.Mock).mockResolvedValue(envelope({ demanda }, 201));
    const input = {
      titulo: 'Semáforo danificado',
      descricao: 'Semáforo na esquina está apagado há 3 dias.',
      categoria: 'ROAD_MAINTENANCE' as const,
      localizacao: 'Rua XV de Novembro, 450',
      prioridade: 'media' as const,
    };

    await expect(criarDemanda(input)).resolves.toEqual(demanda);
    expect(apiClient.post).toHaveBeenCalledWith('/api/demandas', input);
  });

  it('criarDemanda() turns a 422 with field errors into ApiValidationError', async () => {
    (apiClient.post as jest.Mock).mockRejectedValue({
      isAxiosError: true,
      response: {
        data: {
          data: { errors: { titulo: ['Já existe uma demanda com este título.'] } },
          message: 'Dados inválidos.',
          status_code: 422,
        },
      },
    });

    const error = await criarDemanda({
      titulo: 'Duplicada',
      descricao: 'Descrição com mais de dez letras',
      categoria: 'OTHER',
      localizacao: 'Rua A',
      prioridade: 'media',
    }).catch((e) => e);

    expect(error).toBeInstanceOf(ApiValidationError);
    expect(error.errors.titulo).toEqual(['Já existe uma demanda com este título.']);
  });

  it('excluirDemanda() deletes /api/demandas/:id and surfaces the 403 message', async () => {
    (apiClient.delete as jest.Mock).mockRejectedValue({
      isAxiosError: true,
      response: {
        data: {
          data: null,
          message: 'Apenas demandas com status "aberto" podem ser removidas.',
          status_code: 403,
        },
      },
    });

    await expect(excluirDemanda(7)).rejects.toThrow('Apenas demandas com status "aberto" podem ser removidas.');
    expect(apiClient.delete).toHaveBeenCalledWith('/api/demandas/7');
  });

  it('reports a friendly message when the server is unreachable', async () => {
    (apiClient.get as jest.Mock).mockRejectedValue({ isAxiosError: true, message: 'Network Error' });

    await expect(obterDemanda(1)).rejects.toThrow(NETWORK_ERROR_MESSAGE);
  });
});
