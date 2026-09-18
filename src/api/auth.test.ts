import { apiClient } from './client';
import { register, login, getMe, ApiValidationError } from './auth';

jest.mock('./client', () => ({
  apiClient: { post: jest.fn(), get: jest.fn() },
}));

describe('auth api', () => {
  afterEach(() => jest.clearAllMocks());

  it('register() posts to /auth/register and unwraps the user', async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({
      data: {
        data: { id: 1, name: 'testuser', email: 'test@example.com', role: 'cidadao', createdAt: '2026-01-01' },
        message: 'Usuário registrado com sucesso',
        status_code: 201,
      },
    });

    const user = await register({ username: 'testuser', email: 'test@example.com', password: '123456' });

    expect(apiClient.post).toHaveBeenCalledWith('/auth/register', {
      username: 'testuser',
      email: 'test@example.com',
      password: '123456',
    });
    expect(user.name).toBe('testuser');
  });

  it('register() throws ApiValidationError with field errors on 400', async () => {
    (apiClient.post as jest.Mock).mockRejectedValue({
      isAxiosError: true,
      response: {
        data: {
          data: { errors: { email: ['E-mail já cadastrado.'] } },
          message: 'Erro de validação',
          status_code: 400,
        },
      },
    });

    await expect(
      register({ username: 'testuser', email: 'dup@example.com', password: '123456' })
    ).rejects.toBeInstanceOf(ApiValidationError);
  });

  it('login() posts credentials and unwraps tokens + user', async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({
      data: {
        data: {
          access_token: 'access',
          refresh_token: 'refresh',
          user: { id: 1, name: 'testuser', email: 'test@example.com', role: 'cidadao', createdAt: '2026-01-01' },
        },
        message: 'Login realizado com sucesso',
        status_code: 200,
      },
    });

    const result = await login({ email: 'test@example.com', password: '123456' });

    expect(apiClient.post).toHaveBeenCalledWith('/auth/login', {
      email: 'test@example.com',
      password: '123456',
    });
    expect(result.access_token).toBe('access');
    expect(result.user.name).toBe('testuser');
  });

  it('getMe() gets /auth/me and unwraps the user', async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({
      data: {
        data: { id: 1, name: 'testuser', email: 'test@example.com', role: 'cidadao', createdAt: '2026-01-01' },
        message: '',
        status_code: 200,
      },
    });

    const user = await getMe();

    expect(apiClient.get).toHaveBeenCalledWith('/auth/me');
    expect(user.email).toBe('test@example.com');
  });
});
