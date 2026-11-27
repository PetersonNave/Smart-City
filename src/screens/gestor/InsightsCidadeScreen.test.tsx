import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { obterInsightsRecife, type InsightsRecife } from '../../api/insights';
import { createMockRouter } from '../../test-utils/mockRouter';
import { InsightsCidadeScreen } from './InsightsCidadeScreen';

jest.mock('../../api/insights');
const mockRouter = createMockRouter();
jest.mock('expo-router', () => ({ useRouter: () => mockRouter }));

// Números reais da carga publicada no Neon em 23/10/2026.
const insights: InsightsRecife = {
  filtro: { rpa: null, rpa_nome: null },
  indicadores: { total: 11374, atendidas: 7662, taxa_atendimento: 0.674, em_andamento: 3712, bairros: 94 },
  por_situacao: [
    { situacao: 'Atendida', total: 7662 },
    { situacao: 'Execucao', total: 1439 },
    { situacao: 'Cadastrada', total: 1333 },
  ],
  top_servicos: [
    { grupo: 'Iluminacao Publica', total: 4118 },
    { grupo: 'Limpeza Urbana', total: 2584 },
  ],
  por_rpa: [
    { rpa: 1, nome: 'Centro', total: 1177 },
    { rpa: 6, nome: 'Sul', total: 2796 },
  ],
  top_bairros: [{ bairro: 'Cohab Ibura de Cima', total: 732 }],
  fonte: {
    nome: 'Central 156 · EMLURB',
    periodo_inicio: '2026-01-01',
    periodo_fim: '2026-01-30',
    origem_extracao: 'API CKAN',
    carga_id: '493f0d45',
    data_extracao: '2026-10-23T22:15:51.326000+00:00',
    total_bronze: 11374,
    total_final: 11374,
    sem_coordenadas: 5291,
  },
};

describe('InsightsCidadeScreen', () => {
  afterEach(() => jest.clearAllMocks());

  it('shows the pipeline indicators read from the API', async () => {
    (obterInsightsRecife as jest.Mock).mockResolvedValue(insights);

    await render(<InsightsCidadeScreen />);

    await waitFor(() => expect(screen.getByTestId('insights-total')).toBeTruthy());
    expect(obterInsightsRecife).toHaveBeenCalledWith(undefined);
    expect(within(screen.getByTestId('insights-total')).getByText('11.374')).toBeTruthy();
    expect(within(screen.getByTestId('insights-taxa')).getByText('67,4%')).toBeTruthy();
    expect(within(screen.getByTestId('insights-andamento')).getByText('3.712')).toBeTruthy();
    expect(within(screen.getByTestId('insights-bairros')).getByText('94')).toBeTruthy();
    expect(screen.getByLabelText('Atendida: 7.662 (67,4%)')).toBeTruthy();
    expect(screen.getByLabelText('Iluminacao Publica: 4.118')).toBeTruthy();
    expect(screen.getByLabelText('6 Sul: 2.796')).toBeTruthy();
    expect(screen.getByLabelText('Cohab Ibura de Cima: 732')).toBeTruthy();

    const fonte = within(screen.getByTestId('insights-fonte'));
    expect(fonte.getByText(/API CKAN \(Dados Abertos do Recife\) → MongoDB Atlas \(bronze\)/)).toBeTruthy();
    expect(fonte.getByText(/01\/01\/2026 a 30\/01\/2026/)).toBeTruthy();
    expect(fonte.getByText(/carga de 23\/10\/2026 via API CKAN/)).toBeTruthy();
    expect(fonte.getByText(/11\.374 no bronze = 11\.374 no Neon/)).toBeTruthy();
  });

  it('filters by RPA and back to the whole city', async () => {
    (obterInsightsRecife as jest.Mock).mockResolvedValue(insights);
    await render(<InsightsCidadeScreen />);
    await waitFor(() => expect(screen.getByTestId('insights-total')).toBeTruthy());

    await fireEvent.press(screen.getByTestId('insights-rpa-6'));
    await waitFor(() => expect(obterInsightsRecife).toHaveBeenLastCalledWith(6));

    await fireEvent.press(screen.getByTestId('insights-rpa-todas'));
    await waitFor(() => expect(obterInsightsRecife).toHaveBeenLastCalledWith(undefined));
  });

  it('keeps the data of the last selected RPA when responses arrive out of order', async () => {
    const sul = { ...insights, filtro: { rpa: 6, rpa_nome: 'Sul' }, indicadores: { ...insights.indicadores, total: 2796 } };
    let resolverSul: (value: InsightsRecife) => void = () => {};
    (obterInsightsRecife as jest.Mock)
      .mockResolvedValueOnce(insights)
      .mockReturnValueOnce(new Promise((resolve) => (resolverSul = resolve)))
      .mockResolvedValueOnce(insights);

    await render(<InsightsCidadeScreen />);
    await waitFor(() => expect(within(screen.getByTestId('insights-total')).getByText('11.374')).toBeTruthy());

    await fireEvent.press(screen.getByTestId('insights-rpa-6'));
    await fireEvent.press(screen.getByTestId('insights-rpa-todas'));
    await waitFor(() => expect(obterInsightsRecife).toHaveBeenCalledTimes(3));

    // A resposta antiga (Sul) chega por último e não pode sobrescrever a seleção atual (Todas).
    await act(async () => resolverSul(sul));

    expect(within(screen.getByTestId('insights-total')).getByText('11.374')).toBeTruthy();
    expect(screen.getByTestId('insights-rpa-todas').props.accessibilityState).toEqual({ selected: true });
  });

  it('signals the reload while another RPA is loading', async () => {
    (obterInsightsRecife as jest.Mock)
      .mockResolvedValueOnce(insights)
      .mockReturnValueOnce(new Promise(() => {}));

    await render(<InsightsCidadeScreen />);
    await waitFor(() => expect(screen.getByTestId('insights-total')).toBeTruthy());
    expect(screen.queryByTestId('insights-atualizando')).toBeNull();

    await fireEvent.press(screen.getByTestId('insights-rpa-6'));

    expect(screen.getByTestId('insights-atualizando')).toBeTruthy();
  });

  it('does not show the previous region numbers when the new RPA fails', async () => {
    (obterInsightsRecife as jest.Mock)
      .mockResolvedValueOnce(insights)
      .mockRejectedValueOnce(new Error('Dados da pipeline indisponíveis no momento. Tente novamente em instantes.'));

    await render(<InsightsCidadeScreen />);
    await waitFor(() => expect(screen.getByTestId('insights-total')).toBeTruthy());

    await fireEvent.press(screen.getByTestId('insights-rpa-6'));

    await waitFor(() => expect(screen.getByTestId('insights-error')).toBeTruthy());
    expect(screen.queryByTestId('insights-total')).toBeNull();
  });

  it('shows the error and retries', async () => {
    (obterInsightsRecife as jest.Mock)
      .mockRejectedValueOnce(new Error('Dados da pipeline indisponíveis no momento. Tente novamente em instantes.'))
      .mockResolvedValueOnce(insights);

    await render(<InsightsCidadeScreen />);

    await waitFor(() =>
      expect(screen.getByText('Dados da pipeline indisponíveis no momento. Tente novamente em instantes.')).toBeTruthy()
    );
    await fireEvent.press(screen.getByTestId('insights-retry'));
    await waitFor(() => expect(screen.getByTestId('insights-total')).toBeTruthy());
  });

  it('shows an empty state when the selection has no requests', async () => {
    (obterInsightsRecife as jest.Mock).mockResolvedValue({
      ...insights,
      filtro: { rpa: 2, rpa_nome: 'Norte' },
      indicadores: { total: 0, atendidas: 0, taxa_atendimento: null, em_andamento: 0, bairros: 0 },
      por_situacao: [],
      top_servicos: [],
      top_bairros: [],
    });

    await render(<InsightsCidadeScreen />);

    await waitFor(() => expect(screen.getByTestId('insights-vazio')).toBeTruthy());
    expect(within(screen.getByTestId('insights-taxa')).getByText('—')).toBeTruthy();
    expect(screen.queryByTestId('insights-situacao')).toBeNull();
  });

  it('goes back', async () => {
    (obterInsightsRecife as jest.Mock).mockResolvedValue(insights);
    await render(<InsightsCidadeScreen />);
    await fireEvent.press(screen.getByTestId('insights-header-back'));
    expect(mockRouter.back).toHaveBeenCalled();
  });
});
