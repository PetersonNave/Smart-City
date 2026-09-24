import { fireEvent, render, screen } from '@testing-library/react-native';
import { DemandaEnviadaScreen } from './DemandaEnviadaScreen';

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
};

describe('DemandaEnviadaScreen', () => {
  const navigation = { navigate: jest.fn() };

  beforeEach(() => {
    render(<DemandaEnviadaScreen navigation={navigation as never} route={{ params: { demanda } } as never} />);
  });
  afterEach(() => jest.clearAllMocks());

  it('shows the protocol number and the initial status', () => {
    expect(screen.getByText('Demanda registrada com sucesso!')).toBeTruthy();
    expect(screen.getByTestId('enviada-protocolo').props.children).toBe('#2026-00187');
    expect(screen.getByText('Pendente')).toBeTruthy();
  });

  it('"Acompanhar demanda" opens the detail inside the Demandas tab', () => {
    fireEvent.press(screen.getByTestId('enviada-acompanhar'));

    expect(navigation.navigate).toHaveBeenCalledWith('Tabs', {
      screen: 'Demandas',
      params: { screen: 'DemandaDetalhe', params: { id: 187 }, initial: false },
    });
  });

  it('"Voltar ao início" goes to the Início tab', () => {
    fireEvent.press(screen.getByTestId('enviada-inicio'));

    expect(navigation.navigate).toHaveBeenCalledWith('Tabs', { screen: 'Inicio' });
  });
});
