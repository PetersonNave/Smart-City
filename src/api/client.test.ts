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
});
