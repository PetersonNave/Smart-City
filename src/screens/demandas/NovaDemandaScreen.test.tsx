import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { criarDemanda } from '../../api/demandas';
import { ApiValidationError } from '../../api/envelope';
import { useCurrentAddress } from '../../hooks/useCurrentAddress';
import { NovaDemandaScreen } from './NovaDemandaScreen';

jest.mock('../../api/demandas', () => ({
  ...jest.requireActual('../../api/demandas'),
  criarDemanda: jest.fn(),
}));
jest.mock('../../hooks/useCurrentAddress');
// A escolha de foto em si é coberta no teste do PhotoField; aqui só simulamos o resultado.
jest.mock('../../components/PhotoField', () => {
  const { Pressable, Text } = require('react-native');
  return {
    PhotoField: ({ onChange, error }: { onChange: (uri: string) => void; error?: string }) => (
      <>
        <Pressable testID="nova-foto" onPress={() => onChange('file:///foto.jpg')} />
        {error ? <Text>{error}</Text> : null}
      </>
    ),
  };
});

const navigation = { goBack: jest.fn(), replace: jest.fn() };

function renderScreen() {
  return render(<NovaDemandaScreen navigation={navigation as never} route={{} as never} />);
}

function fillForm() {
  fireEvent.press(screen.getByTestId('nova-foto'));
  fireEvent.changeText(screen.getByTestId('nova-titulo-input'), 'Semáforo danificado');
  fireEvent.press(screen.getByTestId('nova-categoria-trigger'));
  fireEvent.press(screen.getByTestId('nova-categoria-option-PUBLIC_LIGHTING'));
  fireEvent.changeText(screen.getByTestId('nova-descricao-input'), 'Semáforo apagado há três dias.');
}

describe('NovaDemandaScreen', () => {
  beforeEach(() => {
    (useCurrentAddress as jest.Mock).mockReturnValue({
      status: 'ready',
      address: 'Rua XV de Novembro, 450',
      retry: jest.fn(),
    });
  });
  afterEach(() => jest.clearAllMocks());

  it('pre-fills the location from the GPS', async () => {
    renderScreen();

    await waitFor(() =>
      expect(screen.getByTestId('nova-localizacao-input').props.value).toBe('Rua XV de Novembro, 450')
    );
    expect(screen.getByText('GPS capturado automaticamente')).toBeTruthy();
  });

  it('shows the Figma validation messages when submitting an empty form', async () => {
    (useCurrentAddress as jest.Mock).mockReturnValue({ status: 'denied', address: null, retry: jest.fn() });
    renderScreen();

    fireEvent.press(screen.getByTestId('nova-submit'));

    await waitFor(() => expect(screen.getByText('Anexe ao menos uma foto')).toBeTruthy());
    expect(screen.getByText('Selecione uma categoria')).toBeTruthy();
    expect(screen.getByText('Informe a localização do problema')).toBeTruthy();
    expect(criarDemanda).not.toHaveBeenCalled();
  });

  it('sends the demand in the backend format and opens the confirmation screen', async () => {
    const created = { id: 187, status: 'PENDING', createdAt: '2026-10-15T12:00:00' };
    (criarDemanda as jest.Mock).mockResolvedValue(created);
    renderScreen();
    await waitFor(() => expect(screen.getByTestId('nova-localizacao-input').props.value).not.toBe(''));

    fillForm();
    fireEvent.press(screen.getByTestId('nova-submit'));

    await waitFor(() =>
      expect(criarDemanda).toHaveBeenCalledWith({
        titulo: 'Semáforo danificado',
        descricao: 'Semáforo apagado há três dias.',
        categoria: 'PUBLIC_LIGHTING',
        localizacao: 'Rua XV de Novembro, 450',
        prioridade: 'media',
      })
    );
    expect(navigation.replace).toHaveBeenCalledWith('DemandaEnviada', { demanda: created });
  });

  it('maps a duplicate-title API error onto the title field', async () => {
    (criarDemanda as jest.Mock).mockRejectedValue(
      new ApiValidationError('Dados inválidos.', { titulo: ['Já existe uma demanda com este título.'] })
    );
    renderScreen();
    await waitFor(() => expect(screen.getByTestId('nova-localizacao-input').props.value).not.toBe(''));

    fillForm();
    fireEvent.press(screen.getByTestId('nova-submit'));

    await waitFor(() => expect(screen.getByText('Já existe uma demanda com este título.')).toBeTruthy());
    expect(navigation.replace).not.toHaveBeenCalled();
  });
});
