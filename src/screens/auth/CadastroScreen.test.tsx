import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ApiValidationError } from '../../api/auth';
import { useAuth } from '../../auth/AuthContext';
import type { AuthStackParamList } from '../../navigation/AuthStack';
import { CadastroScreen } from './CadastroScreen';

jest.mock('../../auth/AuthContext');

const Stack = createNativeStackNavigator<AuthStackParamList>();

function LoginPlaceholder() {
  return null;
}

function renderScreen() {
  return render(
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Cadastro" component={CadastroScreen} />
        <Stack.Screen name="Login" component={LoginPlaceholder} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function fillValidForm() {
  fireEvent.changeText(screen.getByTestId('cadastro-username-input'), 'testuser');
  fireEvent.changeText(screen.getByTestId('cadastro-email-input'), 'test@example.com');
  fireEvent.changeText(screen.getByTestId('cadastro-password-input'), '123456');
  fireEvent.changeText(screen.getByTestId('cadastro-confirmPassword-input'), '123456');
}

describe('CadastroScreen', () => {
  afterEach(() => jest.clearAllMocks());

  it('shows a validation error when passwords do not match', async () => {
    (useAuth as jest.Mock).mockReturnValue({ register: jest.fn() });
    renderScreen();

    fillValidForm();
    fireEvent.changeText(screen.getByTestId('cadastro-confirmPassword-input'), 'different');
    fireEvent.press(screen.getByTestId('cadastro-submit'));

    await waitFor(() => expect(screen.getByText('As senhas não coincidem')).toBeTruthy());
  });

  it('calls useAuth().register with the typed data on valid submit', async () => {
    const register = jest.fn().mockResolvedValue(undefined);
    (useAuth as jest.Mock).mockReturnValue({ register });
    renderScreen();

    fillValidForm();
    fireEvent.press(screen.getByTestId('cadastro-submit'));

    await waitFor(() => expect(register).toHaveBeenCalledWith('testuser', 'test@example.com', '123456'));
  });

  it('maps a duplicate-email API error onto the email field', async () => {
    const register = jest
      .fn()
      .mockRejectedValue(
        new ApiValidationError('Erro de validação', { email: ['E-mail já cadastrado.'] })
      );
    (useAuth as jest.Mock).mockReturnValue({ register });
    renderScreen();

    fillValidForm();
    fireEvent.press(screen.getByTestId('cadastro-submit'));

    await waitFor(() => expect(screen.getByText('E-mail já cadastrado.')).toBeTruthy());
  });
});
