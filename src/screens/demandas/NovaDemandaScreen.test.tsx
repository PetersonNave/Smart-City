import { Alert, Text } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
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

const Stack = createNativeStackNavigator();

function StartScreen() {
  return <Text>Tela anterior</Text>;
}

function EnviadaScreen({ route }: { route: { params: { demanda: { id: number } } } }) {
  return <Text>Enviada #{route.params.demanda.id}</Text>;
}

// Stack real (Start → NovaDemanda) para o voltar e o bloqueio de saída funcionarem de verdade.
function renderScreen() {
  return render(
    <NavigationContainer
      initialState={{ index: 1, routes: [{ name: 'Start' }, { name: 'NovaDemanda' }] }}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Start" component={StartScreen} />
        <Stack.Screen name="NovaDemanda" component={NovaDemandaScreen as never} />
        <Stack.Screen name="DemandaEnviada" component={EnviadaScreen as never} />
      </Stack.Navigator>
    </NavigationContainer>
  );
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
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    (useCurrentAddress as jest.Mock).mockReturnValue({
      status: 'ready',
      address: 'Rua XV de Novembro, 450',
      retry: jest.fn(),
    });
  });
  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

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
    await waitFor(() => expect(screen.getByText('Enviada #187')).toBeTruthy());
    // Envio bem-sucedido não pode disparar o aviso de descartar.
    expect(Alert.alert).not.toHaveBeenCalled();
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
    expect(screen.queryByText('Enviada #187')).toBeNull();
  });

  it('leaves without asking when nothing was filled in', async () => {
    renderScreen();

    fireEvent.press(screen.getByTestId('nova-header-back'));

    await waitFor(() => expect(screen.getByText('Tela anterior')).toBeTruthy());
    expect(Alert.alert).not.toHaveBeenCalled();
  });

  it('asks before discarding a filled-in form and only leaves on Descartar', async () => {
    renderScreen();
    fireEvent.changeText(screen.getByTestId('nova-titulo-input'), 'Semáforo danificado');

    fireEvent.press(screen.getByTestId('nova-header-back'));
    await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith('Descartar demanda?', expect.any(String), expect.any(Array)));
    expect(screen.queryByText('Tela anterior')).toBeNull();

    const buttons = (Alert.alert as jest.Mock).mock.calls[0][2] as { text: string; onPress?: () => void }[];
    buttons.find((button) => button.text === 'Descartar')?.onPress?.();

    await waitFor(() => expect(screen.getByText('Tela anterior')).toBeTruthy());
  });
});
