import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { obterDemanda } from '../../api/demandas';
import { createMockRouter } from '../../test-utils/mockRouter';
import { DemandaEnviadaScreen } from './DemandaEnviadaScreen';

jest.mock('../../api/demandas');

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
  category: 'PUBLIC_LIGHTING',
  location: 'Rua XV de Novembro, 450',
  status: 'PENDING',
  priority: 'media',
  createdAt: '2026-10-15T12:00:00',
  updatedAt: null,
  photoUrl: null,
};

function renderScreen(params: Record<string, string> = { id: '187' }) {
  mockParams = params;
  return render(<DemandaEnviadaScreen />);
}

describe('DemandaEnviadaScreen', () => {
  beforeEach(() => (obterDemanda as jest.Mock).mockResolvedValue(demanda));
  afterEach(() => jest.clearAllMocks());

  it('loads the demand from the id in the URL and shows the protocol and initial status', async () => {
    renderScreen();

    expect(screen.getByText('Demanda registrada com sucesso!')).toBeTruthy();
    await waitFor(() => expect(screen.getByTestId('enviada-protocolo').props.children).toBe('#2026-00187'));
    expect(obterDemanda).toHaveBeenCalledWith(187);
    expect(screen.getByText('Pendente')).toBeTruthy();
  });

  it('"Acompanhar demanda" dismisses this screen and opens the demand detail', async () => {
    renderScreen();
    await waitFor(() => expect(screen.getByTestId('enviada-protocolo')).toBeTruthy());

    fireEvent.press(screen.getByTestId('enviada-acompanhar'));

    expect(mockRouter.dismissTo).toHaveBeenCalledWith({ pathname: '/demandas/[id]', params: { id: '187' } });
  });

  it('"Voltar ao início" dismisses to the home tab', async () => {
    renderScreen();
    await waitFor(() => expect(screen.getByTestId('enviada-protocolo')).toBeTruthy());

    fireEvent.press(screen.getByTestId('enviada-inicio'));

    expect(mockRouter.dismissTo).toHaveBeenCalledWith('/');
  });

  it('does not show the photo warning when the photo was uploaded', async () => {
    renderScreen();
    await waitFor(() => expect(screen.getByTestId('enviada-protocolo')).toBeTruthy());
    expect(screen.queryByTestId('enviada-foto-pendente')).toBeNull();
  });

  it('tells the user the photo can be added later when the upload failed', async () => {
    renderScreen({ id: '187', fotoPendente: '1' });

    expect(screen.getByTestId('enviada-foto-pendente')).toBeTruthy();
    expect(screen.getByText(/A foto não pôde ser enviada/)).toBeTruthy();
    await waitFor(() => expect(screen.getByTestId('enviada-protocolo')).toBeTruthy());
  });

  it('shows a retryable error if the demand cannot be loaded', async () => {
    (obterDemanda as jest.Mock).mockRejectedValueOnce(new Error('Sem conexão')).mockResolvedValueOnce(demanda);
    renderScreen();

    await waitFor(() => expect(screen.getByTestId('enviada-erro')).toBeTruthy());
    fireEvent.press(screen.getByTestId('enviada-erro'));

    await waitFor(() => expect(screen.getByTestId('enviada-protocolo')).toBeTruthy());
  });
});
