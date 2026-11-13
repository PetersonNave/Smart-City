import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { HomeScreen } from './HomeScreen';
import { useAuth } from '../../auth/AuthContext';

import { createMockRouter } from '../../test-utils/mockRouter';

jest.mock('../../auth/AuthContext');

const mockRouter = createMockRouter();
jest.mock('expo-router', () => ({ useRouter: () => mockRouter }));

const user = { id: 1, name: 'testuser', email: 'test@example.com', role: 'cidadao', createdAt: '2026-01-01' };

describe('HomeScreen', () => {
  afterEach(async () => jest.clearAllMocks());

  it('greets the logged-in user by name', async () => {
    (useAuth as jest.Mock).mockReturnValue({ user, logout: jest.fn() });

    await render(<HomeScreen />);
    expect(screen.getByText(/testuser/)).toBeTruthy();
  });

  it('calls logout() when the logout button is pressed', async () => {
    const logout = jest.fn().mockResolvedValue(undefined);
    (useAuth as jest.Mock).mockReturnValue({ user, logout });

    await render(<HomeScreen />);
    await fireEvent.press(screen.getByTestId('home-logout'));

    await waitFor(() => expect(logout).toHaveBeenCalledTimes(1));
  });

  it('opens the new-demand flow from the shortcut button', async () => {
    (useAuth as jest.Mock).mockReturnValue({ user, logout: jest.fn() });

    await render(<HomeScreen />);
    await fireEvent.press(screen.getByTestId('home-nova-demanda'));

    expect(mockRouter.push).toHaveBeenCalledWith('/nova-demanda');
  });
});
