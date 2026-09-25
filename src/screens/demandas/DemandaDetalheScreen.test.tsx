import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { obterDemanda } from '../../api/demandas';
import { useAuth } from '../../auth/AuthContext';
import { createMockRouter } from '../../test-utils/mockRouter';
import { DemandaDetalheScreen } from './DemandaDetalheScreen';

jest.mock('../../api/demandas');
jest.mock('../../auth/AuthContext');

const mockRouter = createMockRouter();
let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => mockParams,
}));

const demanda = {
  id: 187,
  title: 'Semáforo danificado',
  description: 'Semáforo apagado há três dias.',
  category: 'ROAD_MAINTENANCE',
  location: 'Rua XV de Novembro, 450',
  status: 'PENDING',
  priority: 'media',
  createdAt: '2026-10-15T12:00:00',
  updatedAt: null,
  photoUrl: null,
};

function renderScreen(params: Record<string, string> = { id: '187' }) {
  mockParams = params;
  return render(<DemandaDetalheScreen />);
}

describe('DemandaDetalheScreen', () => {
  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({ user: { id: 1, role: 'cidadao', name: 'Ana' } });
  });
  afterEach(() => jest.clearAllMocks());

  it('loads the demand by id and shows every detail row', async () => {
    (obterDemanda as jest.Mock).mockResolvedValue(demanda);

    renderScreen();

    await waitFor(() => expect(screen.getByText('Semáforo danificado')).toBeTruthy());
    expect(obterDemanda).toHaveBeenCalledWith(187);
    expect(screen.getByText('Rua XV de Novembro, 450')).toBeTruthy();
    expect(screen.getByText('Manutenção de vias')).toBeTruthy();
    expect(screen.getByText('15/10/2026')).toBeTruthy();
    expect(screen.getByText('#2026-00187')).toBeTruthy();
  });

  it('shows the API error and retries', async () => {
    (obterDemanda as jest.Mock).mockRejectedValueOnce(new Error('Demanda não encontrada.')).mockResolvedValueOnce(demanda);

    renderScreen();

    await waitFor(() => expect(screen.getByText('Demanda não encontrada.')).toBeTruthy());
    fireEvent.press(screen.getByTestId('detalhe-retry'));
    await waitFor(() => expect(screen.getByTestId('detalhe-card')).toBeTruthy());
  });

  it('goes back from the header', async () => {
    (obterDemanda as jest.Mock).mockResolvedValue(demanda);
    renderScreen();

    fireEvent.press(screen.getByTestId('detalhe-header-back'));
    expect(mockRouter.back).toHaveBeenCalled();
    await waitFor(() => expect(screen.getByTestId('detalhe-card')).toBeTruthy());
  });

  it('pull-to-refresh fetches the latest status', async () => {
    (obterDemanda as jest.Mock)
      .mockResolvedValueOnce(demanda)
      .mockResolvedValueOnce({ ...demanda, status: 'IN_PROGRESS' });

    renderScreen();
    await waitFor(() => expect(screen.getAllByText('PENDENTE').length).toBeGreaterThan(0));

    const { refreshControl } = screen.getByTestId('detalhe-scroll').props;
    await act(async () => {
      await refreshControl.props.onRefresh();
    });

    expect(screen.getAllByText('EM ANÁLISE').length).toBeGreaterThan(0);
    expect(screen.queryByText('PENDENTE')).toBeNull();
  });

  it('shows the saved photo', async () => {
    (obterDemanda as jest.Mock).mockResolvedValue({ ...demanda, photoUrl: 'http://api/fotos/a.jpg' });

    renderScreen();

    await waitFor(() =>
      expect(screen.getByTestId('detalhe-foto-photo').props.source).toEqual({ uri: 'http://api/fotos/a.jpg' })
    );
  });

  it('offers "Editar Demanda" on a pending demand and opens the edit screen', async () => {
    (obterDemanda as jest.Mock).mockResolvedValue(demanda);
    renderScreen();

    await waitFor(() => expect(screen.getByTestId('detalhe-editar')).toBeTruthy());
    fireEvent.press(screen.getByTestId('detalhe-editar'));

    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: '/demandas/[id]/editar', params: { id: '187' } });
  });

  it('hides "Editar Demanda" once the demand left pending (citizen)', async () => {
    (obterDemanda as jest.Mock).mockResolvedValue({ ...demanda, status: 'RESOLVED' });

    renderScreen();

    await waitFor(() => expect(screen.getByTestId('detalhe-card')).toBeTruthy());
    expect(screen.queryByTestId('detalhe-editar')).toBeNull();
  });

  it('shows the Figma success toast and "(atualizada)" label after an edit', async () => {
    (obterDemanda as jest.Mock).mockResolvedValue({ ...demanda, location: 'Av. Brasil, 1200' });

    renderScreen({ id: '187', atualizada: '1', localizacaoAtualizada: '1', fotoFalhou: '0' });

    await waitFor(() => expect(screen.getByText('Demanda atualizada com sucesso!')).toBeTruthy());
    await waitFor(() => expect(screen.getByText('Av. Brasil, 1200')).toBeTruthy());
    expect(screen.getByText('Localização (atualizada)')).toBeTruthy();
  });

  it('warns when the edit was saved but the photo upload failed', async () => {
    (obterDemanda as jest.Mock).mockResolvedValue(demanda);

    renderScreen({ id: '187', atualizada: '2', localizacaoAtualizada: '0', fotoFalhou: '1' });

    await waitFor(() =>
      expect(screen.getByText('Demanda atualizada, mas a foto não pôde ser enviada.')).toBeTruthy()
    );
  });

  it('goes to the list when opened directly without history (deep link)', async () => {
    (obterDemanda as jest.Mock).mockResolvedValue(demanda);
    mockRouter.canGoBack.mockReturnValueOnce(false);
    renderScreen();

    fireEvent.press(screen.getByTestId('detalhe-header-back'));

    expect(mockRouter.replace).toHaveBeenCalledWith('/demandas');
    await waitFor(() => expect(screen.getByTestId('detalhe-card')).toBeTruthy());
  });

  it('shows an error for an invalid id in the URL without calling the API', async () => {
    renderScreen({ id: 'abc' });

    await waitFor(() => expect(screen.getByTestId('detalhe-error')).toBeTruthy());
    expect(obterDemanda).not.toHaveBeenCalled();
  });
});
