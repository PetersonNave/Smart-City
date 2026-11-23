import { fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { HomeScreen } from './HomeScreen';
import { listarDemandas } from '../../api/demandas';
import { useAuth } from '../../auth/AuthContext';

import { createMockRouter } from '../../test-utils/mockRouter';

jest.mock('../../auth/AuthContext');
jest.mock('../../api/demandas');

const mockRouter = createMockRouter();
jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useFocusEffect: (effect: () => void) => require('react').useEffect(effect, [effect]),
}));

const user = { id: 1, name: 'testuser', email: 'test@example.com', role: 'cidadao', createdAt: '2026-01-01' };

const TOTAIS: Record<string, number> = { PENDING: 2, IN_PROGRESS: 1, RESOLVED: 4, REJECTED: 0 };
const recente = {
  id: 9,
  title: 'Poste apagado',
  description: 'Poste apagado na esquina.',
  category: 'PUBLIC_LIGHTING',
  location: 'Rua A, 10',
  status: 'PENDING',
  priority: 'media',
  createdAt: '2026-11-20T10:00:00',
  updatedAt: null,
  photoUrl: null,
};

function mockResumo(recentes: unknown[] = [recente]) {
  (listarDemandas as jest.Mock).mockImplementation(({ status }: { status?: string }) =>
    Promise.resolve({
      demandas: status ? [] : recentes,
      paginacao: { total: status ? TOTAIS[status] : 7, paginas: 1, pagina_atual: 1, por_pagina: 3, tem_proxima: false, tem_anterior: false },
    })
  );
}

describe('HomeScreen', () => {
  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({ user, logout: jest.fn() });
    mockResumo();
  });
  afterEach(async () => jest.clearAllMocks());

  it('greets the logged-in user by name and shows the profile', async () => {
    await render(<HomeScreen />);
    expect(screen.getByText(/testuser/)).toBeTruthy();
    expect(screen.getByText('Perfil: Cidadão')).toBeTruthy();
  });

  it('calls logout() when the logout button is pressed', async () => {
    const logout = jest.fn().mockResolvedValue(undefined);
    (useAuth as jest.Mock).mockReturnValue({ user, logout });

    await render(<HomeScreen />);
    await fireEvent.press(screen.getByTestId('home-logout'));

    await waitFor(() => expect(logout).toHaveBeenCalledTimes(1));
  });

  it('opens the new-demand flow from the shortcut button', async () => {
    await render(<HomeScreen />);
    await fireEvent.press(screen.getByTestId('home-nova-demanda'));

    expect(mockRouter.push).toHaveBeenCalledWith('/nova-demanda');
  });

  it('summarises the citizen demands per status and lists the latest ones', async () => {
    await render(<HomeScreen />);

    await waitFor(() => expect(screen.getByTestId('home-status-RESOLVED')).toBeTruthy());
    expect(within(screen.getByTestId('home-status-PENDING')).getByText('2')).toBeTruthy();
    expect(within(screen.getByTestId('home-status-RESOLVED')).getByText('4')).toBeTruthy();

    await fireEvent.press(screen.getByTestId('home-recente-9'));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: '/demandas/[id]', params: { id: '9' } });
  });

  it('shows the empty message when the citizen has no demands yet', async () => {
    mockResumo([]);
    await render(<HomeScreen />);
    await waitFor(() => expect(screen.getByTestId('home-vazio')).toBeTruthy());
  });

  it('shows the API error with a retry', async () => {
    (listarDemandas as jest.Mock).mockRejectedValueOnce(new Error('Sem conexão com o servidor'));
    await render(<HomeScreen />);

    await waitFor(() => expect(screen.getByText('Sem conexão com o servidor')).toBeTruthy());
    mockResumo();
    await fireEvent.press(screen.getByTestId('home-retry'));
    await waitFor(() => expect(screen.getByTestId('home-status-PENDING')).toBeTruthy());
  });
});
