import { fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { obterMetricas, type MetricasPainel } from '../../api/metricas';
import { useAuth } from '../../auth/AuthContext';
import { createMockRouter } from '../../test-utils/mockRouter';
import { PainelGestorScreen } from './PainelGestorScreen';

jest.mock('../../api/metricas');
jest.mock('../../auth/AuthContext');
const mockRouter = createMockRouter();
jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useFocusEffect: (effect: () => void) => require('react').useEffect(effect, [effect]),
}));

const metricas: MetricasPainel = {
  total: 12,
  por_status: { PENDING: 5, IN_PROGRESS: 3, RESOLVED: 3, REJECTED: 1 },
  por_categoria: {
    ROAD_MAINTENANCE: 6,
    PUBLIC_LIGHTING: 2,
    GARBAGE_COLLECTION: 1,
    SANITATION: 1,
    INSPECTION: 0,
    OTHER: 2,
  },
  por_regiao: { CENTRO: 4, NORTE: 3, SUL: 1, LESTE: 0, OESTE: 0, NAO_INFORMADA: 4 },
  atendidas: 4,
  tempo_medio_atendimento_horas: 36.4,
  taxa_resolucao: 0.25,
};

describe('PainelGestorScreen', () => {
  beforeEach(async () => {
    (useAuth as jest.Mock).mockReturnValue({ user: { id: 9, role: 'gestor', name: 'Gestora' } });
  });
  afterEach(async () => jest.clearAllMocks());

  it('shows the operational indicators from the API', async () => {
    (obterMetricas as jest.Mock).mockResolvedValue(metricas);

    await render(<PainelGestorScreen />);

    await waitFor(() => expect(screen.getByTestId('painel-total')).toBeTruthy());
    expect(within(screen.getByTestId('painel-total')).getByText('12')).toBeTruthy();
    expect(within(screen.getByTestId('painel-status-PENDING')).getByText('5')).toBeTruthy();
    expect(within(screen.getByTestId('painel-tempo-medio')).getByText('1 dia e 12 h')).toBeTruthy();
    expect(screen.getByText(/Taxa de resolução: 25%/)).toBeTruthy();
    expect(screen.getByLabelText('Manutenção de vias: 6')).toBeTruthy();
    expect(screen.getByLabelText('Centro: 4')).toBeTruthy();
    expect(screen.getByLabelText('Não informada: 4')).toBeTruthy();
  });

  it('shows the error with retry when the API refuses', async () => {
    (obterMetricas as jest.Mock)
      .mockRejectedValueOnce(new Error('Acesso restrito a gestores públicos.'))
      .mockResolvedValueOnce(metricas);

    await render(<PainelGestorScreen />);

    await waitFor(() => expect(screen.getByText('Acesso restrito a gestores públicos.')).toBeTruthy());
    await fireEvent.press(screen.getByTestId('painel-retry'));
    await waitFor(() => expect(screen.getByTestId('painel-total')).toBeTruthy());
  });

  it('goes to the demand list to analyse', async () => {
    (obterMetricas as jest.Mock).mockResolvedValue(metricas);
    await render(<PainelGestorScreen />);
    await waitFor(() => expect(screen.getByTestId('painel-analisar')).toBeTruthy());

    await fireEvent.press(screen.getByTestId('painel-analisar'));

    expect(mockRouter.push).toHaveBeenCalledWith('/demandas');
  });

  it('opens the city insights from the open data pipeline', async () => {
    (obterMetricas as jest.Mock).mockResolvedValue(metricas);
    await render(<PainelGestorScreen />);
    await waitFor(() => expect(screen.getByTestId('painel-insights')).toBeTruthy());

    await fireEvent.press(screen.getByTestId('painel-insights'));

    expect(mockRouter.push).toHaveBeenCalledWith('/insights');
  });
});
