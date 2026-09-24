import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { HomeScreen } from './HomeScreen';
import { useAuth } from '../../auth/AuthContext';

const mockNavigate = jest.fn();

jest.mock('../../auth/AuthContext');
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

const user = { id: 1, name: 'testuser', email: 'test@example.com', role: 'cidadao', createdAt: '2026-01-01' };

describe('HomeScreen', () => {
  afterEach(() => jest.clearAllMocks());

  it('greets the logged-in user by name', () => {
    (useAuth as jest.Mock).mockReturnValue({ user, logout: jest.fn() });

    render(<HomeScreen />);
    expect(screen.getByText(/testuser/)).toBeTruthy();
  });

  it('calls logout() when the logout button is pressed', async () => {
    const logout = jest.fn().mockResolvedValue(undefined);
    (useAuth as jest.Mock).mockReturnValue({ user, logout });

    render(<HomeScreen />);
    fireEvent.press(screen.getByTestId('home-logout'));

    await waitFor(() => expect(logout).toHaveBeenCalledTimes(1));
  });

  it('opens the new-demand flow from the shortcut button', () => {
    (useAuth as jest.Mock).mockReturnValue({ user, logout: jest.fn() });

    render(<HomeScreen />);
    fireEvent.press(screen.getByTestId('home-nova-demanda'));

    expect(mockNavigate).toHaveBeenCalledWith('NovaDemanda');
  });
});
