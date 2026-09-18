import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { HomeScreen } from './HomeScreen';
import { useAuth } from '../../auth/AuthContext';

jest.mock('../../auth/AuthContext');

describe('HomeScreen', () => {
  afterEach(() => jest.clearAllMocks());

  it('greets the logged-in user by name', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 1, name: 'testuser', email: 'test@example.com', role: 'cidadao', createdAt: '2026-01-01' },
      logout: jest.fn(),
    });

    render(<HomeScreen />);
    expect(screen.getByText(/testuser/)).toBeTruthy();
  });

  it('calls logout() when the logout button is pressed', async () => {
    const logout = jest.fn().mockResolvedValue(undefined);
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 1, name: 'testuser', email: 'test@example.com', role: 'cidadao', createdAt: '2026-01-01' },
      logout,
    });

    render(<HomeScreen />);
    fireEvent.press(screen.getByTestId('home-logout'));

    await waitFor(() => expect(logout).toHaveBeenCalledTimes(1));
  });
});
