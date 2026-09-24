import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { excluirDemanda, listarDemandas, type Demanda } from '../../api/demandas';
import { useAuth } from '../../auth/AuthContext';
import { DemandasListaScreen } from './DemandasListaScreen';

jest.mock('../../api/demandas');
jest.mock('../../auth/AuthContext');
// Sem NavigationContainer: o foco da tela vira um efeito de montagem comum.
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useFocusEffect: (effect: () => void) => require('react').useEffect(effect, [effect]),
}));

function makeDemanda(overrides: Partial<Demanda>): Demanda {
  return {
    id: 1,
    title: 'Semáforo danificado',
    description: 'Semáforo apagado há três dias.',
    category: 'PUBLIC_LIGHTING',
    location: 'Rua XV de Novembro, 450',
    status: 'PENDING',
    priority: 'media',
    createdAt: '2026-10-15T12:00:00',
    updatedAt: null,
    photoUrl: null,
    ...overrides,
  };
}

const paginacao = { total: 2, paginas: 1, pagina_atual: 1, por_pagina: 10, tem_proxima: false, tem_anterior: false };
const navigation = { navigate: jest.fn() };

function renderScreen() {
  return render(<DemandasListaScreen navigation={navigation as never} route={{} as never} />);
}

describe('DemandasListaScreen', () => {
  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({ user: { id: 1, role: 'cidadao', name: 'Ana' } });
  });
  afterEach(() => jest.clearAllMocks());

  it('lists the citizen demands with the delete button only on pending ones', async () => {
    (listarDemandas as jest.Mock).mockResolvedValue({
      demandas: [makeDemanda({ id: 1 }), makeDemanda({ id: 2, title: 'Poste piscando', status: 'IN_PROGRESS' })],
      paginacao,
    });

    renderScreen();

    await waitFor(() => expect(screen.getByText('Poste piscando')).toBeTruthy());
    expect(screen.getByText('Minhas Demandas')).toBeTruthy();
    expect(screen.getByTestId('demand-card-1-delete')).toBeTruthy();
    expect(screen.queryByTestId('demand-card-2-delete')).toBeNull();
  });

  it('shows the empty state when there are no demands', async () => {
    (listarDemandas as jest.Mock).mockResolvedValue({ demandas: [], paginacao: { ...paginacao, total: 0 } });

    renderScreen();

    await waitFor(() => expect(screen.getByTestId('demandas-empty')).toBeTruthy());
  });

  it('shows an error with retry when the first load fails', async () => {
    (listarDemandas as jest.Mock)
      .mockRejectedValueOnce(new Error('Sem conexão'))
      .mockResolvedValueOnce({ demandas: [makeDemanda({})], paginacao });

    renderScreen();

    await waitFor(() => expect(screen.getByText('Sem conexão')).toBeTruthy());
    fireEvent.press(screen.getByTestId('demandas-retry'));
    await waitFor(() => expect(screen.getByText('Semáforo danificado')).toBeTruthy());
  });

  it('confirms, deletes and removes the demand, then shows the success toast', async () => {
    (listarDemandas as jest.Mock).mockResolvedValue({ demandas: [makeDemanda({ id: 1 })], paginacao });
    (excluirDemanda as jest.Mock).mockResolvedValue(undefined);

    renderScreen();
    await waitFor(() => expect(screen.getByTestId('demand-card-1-delete')).toBeTruthy());

    fireEvent.press(screen.getByTestId('demand-card-1-delete'));
    expect(screen.getByText('Excluir Demanda?')).toBeTruthy();
    fireEvent.press(screen.getByTestId('delete-modal-confirm'));

    await waitFor(() => expect(screen.getByText('Demanda excluída com sucesso!')).toBeTruthy());
    expect(excluirDemanda).toHaveBeenCalledWith(1);
    expect(screen.queryByTestId('demand-card-1')).toBeNull();
  });

  it('opens the detail from an expanded card and the new-demand flow from the FAB', async () => {
    (listarDemandas as jest.Mock).mockResolvedValue({ demandas: [makeDemanda({ id: 5 })], paginacao });

    renderScreen();
    await waitFor(() => expect(screen.getByTestId('demand-card-5')).toBeTruthy());

    fireEvent.press(screen.getByTestId('demand-card-5'));
    fireEvent.press(screen.getByTestId('demand-card-5-open'));
    fireEvent.press(screen.getByTestId('demandas-fab'));

    expect(navigation.navigate).toHaveBeenCalledWith('DemandaDetalhe', { id: 5 });
    expect(navigation.navigate).toHaveBeenCalledWith('NovaDemanda');
  });
});
