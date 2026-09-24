import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { obterDemanda } from '../../api/demandas';
import { DemandaDetalheScreen } from './DemandaDetalheScreen';

jest.mock('../../api/demandas');

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
};

function renderScreen(navigation = { goBack: jest.fn(), canGoBack: () => true, navigate: jest.fn() }) {
  render(<DemandaDetalheScreen navigation={navigation as never} route={{ params: { id: 187 } } as never} />);
  return navigation;
}

describe('DemandaDetalheScreen', () => {
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
    const navigation = renderScreen();

    fireEvent.press(screen.getByTestId('detalhe-header-back'));
    expect(navigation.goBack).toHaveBeenCalled();
    await waitFor(() => expect(screen.getByTestId('detalhe-card')).toBeTruthy());
  });
});
