import { render, screen, waitFor, act } from '@testing-library/react-native';
import { Text } from 'react-native';
import { AuthProvider, useAuth } from './AuthContext';
import { getStoredTokens, setStoredTokens, clearStoredTokens } from './storage';
import { login as apiLogin, getMe, logout as apiLogout } from '../api/auth';

jest.mock('./storage');
jest.mock('../api/auth');

function Probe() {
  const { status, user, login, logout } = useAuth();
  return (
    <>
      <Text testID="status">{status}</Text>
      <Text testID="user-name">{user?.name ?? ''}</Text>
      <Text testID="login" onPress={() => login('test@example.com', '123456')}>
        login
      </Text>
      <Text testID="logout" onPress={() => logout()}>
        logout
      </Text>
    </>
  );
}

describe('AuthContext', () => {
  afterEach(() => jest.clearAllMocks());

  it('starts as guest when there are no stored tokens', async () => {
    (getStoredTokens as jest.Mock).mockResolvedValue(null);

    render(<AuthProvider><Probe /></AuthProvider>);

    await waitFor(() => expect(screen.getByTestId('status').props.children).toBe('guest'));
  });

  it('restores the session when a stored token resolves via getMe()', async () => {
    (getStoredTokens as jest.Mock).mockResolvedValue({ accessToken: 'a', refreshToken: 'b' });
    (getMe as jest.Mock).mockResolvedValue({ id: 1, name: 'testuser', email: 'test@example.com', role: 'cidadao', createdAt: '2026-01-01' });

    render(<AuthProvider><Probe /></AuthProvider>);

    await waitFor(() => expect(screen.getByTestId('status').props.children).toBe('authenticated'));
    expect(screen.getByTestId('user-name').props.children).toBe('testuser');
  });

  it('falls back to guest and clears tokens when getMe() fails on boot', async () => {
    (getStoredTokens as jest.Mock).mockResolvedValue({ accessToken: 'a', refreshToken: 'b' });
    (getMe as jest.Mock).mockRejectedValue(new Error('unauthorized'));

    render(<AuthProvider><Probe /></AuthProvider>);

    await waitFor(() => expect(screen.getByTestId('status').props.children).toBe('guest'));
    expect(clearStoredTokens).toHaveBeenCalled();
  });

  it('login() stores tokens and moves to authenticated', async () => {
    (getStoredTokens as jest.Mock).mockResolvedValue(null);
    (apiLogin as jest.Mock).mockResolvedValue({
      access_token: 'access',
      refresh_token: 'refresh',
      user: { id: 1, name: 'testuser', email: 'test@example.com', role: 'cidadao', createdAt: '2026-01-01' },
    });

    render(<AuthProvider><Probe /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('status').props.children).toBe('guest'));

    await act(async () => {
      screen.getByTestId('login').props.onPress();
    });

    expect(setStoredTokens).toHaveBeenCalledWith({ accessToken: 'access', refreshToken: 'refresh' });
    await waitFor(() => expect(screen.getByTestId('status').props.children).toBe('authenticated'));
  });

  it('logout() clears tokens and moves to guest', async () => {
    (getStoredTokens as jest.Mock).mockResolvedValue({ accessToken: 'a', refreshToken: 'b' });
    (getMe as jest.Mock).mockResolvedValue({ id: 1, name: 'testuser', email: 'test@example.com', role: 'cidadao', createdAt: '2026-01-01' });
    (apiLogout as jest.Mock).mockResolvedValue(null);

    render(<AuthProvider><Probe /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('status').props.children).toBe('authenticated'));

    await act(async () => {
      screen.getByTestId('logout').props.onPress();
    });

    expect(clearStoredTokens).toHaveBeenCalled();
    await waitFor(() => expect(screen.getByTestId('status').props.children).toBe('guest'));
  });
});
