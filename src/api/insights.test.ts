import { apiClient } from './client';
import { obterInsightsRecife } from './insights';

jest.mock('./client', () => ({
  apiClient: { get: jest.fn() },
}));

const dados = { indicadores: { total: 11374 } };

describe('obterInsightsRecife', () => {
  beforeEach(() => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: { data: dados, message: '', status_code: 200 } });
  });
  afterEach(() => jest.clearAllMocks());

  it('fetches the whole city without params', async () => {
    await expect(obterInsightsRecife()).resolves.toEqual(dados);
    expect(apiClient.get).toHaveBeenCalledWith('/api/insights/recife', { params: undefined });
  });

  it('filters by RPA', async () => {
    await obterInsightsRecife(3);
    expect(apiClient.get).toHaveBeenCalledWith('/api/insights/recife', { params: { rpa: 3 } });
  });
});
