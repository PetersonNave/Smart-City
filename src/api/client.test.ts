import MockAdapter from 'axios-mock-adapter';
import { apiClient, refreshClient, setOnRefreshFailure } from './client';
import { getStoredTokens, setStoredTokens, clearStoredTokens } from '../auth/storage';

jest.mock('../auth/storage');

describe('apiClient', () => {
  let mock: MockAdapter;
  let refreshMock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(apiClient);
    refreshMock = new MockAdapter(refreshClient);
    jest.clearAllMocks();
  });

  afterEach(() => {
    mock.restore();
    refreshMock.restore();
  });

  it('attaches the stored access token as a Bearer header', async () => {
    (getStoredTokens as jest.Mock).mockResolvedValue({
      accessToken: 'access-123',
      refreshToken: 'refresh-456',
    });
    mock.onGet('/auth/me').reply((config) => {
      expect(config.headers?.Authorization).toBe('Bearer access-123');
      return [200, { data: { id: 1 }, message: '', status_code: 200 }];
    });

    await apiClient.get('/auth/me');
  });

  it('refreshes the token once on 401 and retries the original request', async () => {
    (getStoredTokens as jest.Mock).mockResolvedValue({
      accessToken: 'expired-access',
      refreshToken: 'refresh-456',
    });

    let callCount = 0;
    mock.onGet('/auth/me').reply(() => {
      callCount += 1;
      if (callCount === 1) {
        return [401, { data: null, message: 'Token expirado', status_code: 401 }];
      }
      return [200, { data: { id: 1 }, message: '', status_code: 200 }];
    });
    refreshMock.onPost('/auth/refresh').reply(200, {
      data: { access_token: 'new-access', refresh_token: 'new-refresh' },
      message: 'Token renovado',
      status_code: 200,
    });

    const response = await apiClient.get('/auth/me');

    expect(response.status).toBe(200);
    expect(setStoredTokens).toHaveBeenCalledWith({
      accessToken: 'new-access',
      refreshToken: 'new-refresh',
    });
  });

  it('clears tokens and notifies on refresh failure', async () => {
    (getStoredTokens as jest.Mock).mockResolvedValue({
      accessToken: 'expired-access',
      refreshToken: 'invalid-refresh',
    });

    mock.onGet('/auth/me').reply(401, { data: null, message: 'Token expirado', status_code: 401 });
    refreshMock.onPost('/auth/refresh').reply(401, { data: null, message: 'Refresh token inválido', status_code: 401 });

    const onFailure = jest.fn();
    setOnRefreshFailure(onFailure);

    await expect(apiClient.get('/auth/me')).rejects.toBeTruthy();
    expect(clearStoredTokens).toHaveBeenCalled();
    expect(onFailure).toHaveBeenCalled();

    setOnRefreshFailure(null);
  });

  it('shares a single refresh between concurrent 401s (the backend rotates refresh tokens)', async () => {
    let stored = { accessToken: 'expired-access', refreshToken: 'refresh-1' };
    (getStoredTokens as jest.Mock).mockImplementation(async () => stored);
    (setStoredTokens as jest.Mock).mockImplementation(async (tokens) => {
      stored = tokens;
    });

    mock.onGet(/\/api\/demandas.*/).reply((config) =>
      config.headers?.Authorization === 'Bearer new-access'
        ? [200, { data: {}, message: '', status_code: 200 }]
        : [401, { data: null, message: 'Token expirado', status_code: 401 }]
    );
    let refreshCalls = 0;
    refreshMock.onPost('/auth/refresh').reply((config) => {
      refreshCalls += 1;
      // Um refresh token já usado é recusado, como no backend.
      return JSON.parse(config.data).refresh_token === 'refresh-1' && refreshCalls === 1
        ? [200, { data: { access_token: 'new-access', refresh_token: 'refresh-2' }, message: '', status_code: 200 }]
        : [401, { data: null, message: 'Refresh token já utilizado', status_code: 401 }];
    });
    const onFailure = jest.fn();
    setOnRefreshFailure(onFailure);

    const responses = await Promise.all([
      apiClient.get('/api/demandas'),
      apiClient.get('/api/demandas/1'),
      apiClient.get('/api/demandas/2'),
    ]);

    expect(responses.map((response) => response.status)).toEqual([200, 200, 200]);
    expect(refreshCalls).toBe(1);
    expect(onFailure).not.toHaveBeenCalled();
    setOnRefreshFailure(null);
  });

  it('does not try to refresh when the login itself returns 401 (wrong password)', async () => {
    (getStoredTokens as jest.Mock).mockResolvedValue(null);
    mock.onPost('/auth/login').reply(401, { data: null, message: 'E-mail ou senha incorretos.', status_code: 401 });
    const onFailure = jest.fn();
    setOnRefreshFailure(onFailure);

    await expect(apiClient.post('/auth/login', {})).rejects.toMatchObject({ response: { status: 401 } });
    expect(onFailure).not.toHaveBeenCalled();
    expect(clearStoredTokens).not.toHaveBeenCalled();
    setOnRefreshFailure(null);
  });

  it('gives up on requests that hang (timeout configured)', () => {
    expect(apiClient.defaults.timeout).toBeGreaterThan(0);
  });
});
