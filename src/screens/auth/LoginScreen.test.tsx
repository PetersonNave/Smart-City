import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../../auth/AuthContext';
import type { AuthStackParamList } from '../../navigation/AuthStack';
import { LoginScreen } from './LoginScreen';

jest.mock('../../auth/AuthContext');

const Stack = createNativeStackNavigator<AuthStackParamList>();

function CadastroPlaceholder() {
  return null;
}

function renderScreen() {
  return render(
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Cadastro" component={CadastroPlaceholder} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

describe('LoginScreen', () => {
  afterEach(() => jest.clearAllMocks());

  it('shows validation errors for empty fields on submit', async () => {
    (useAuth as jest.Mock).mockReturnValue({ login: jest.fn() });
    renderScreen();

    fireEvent.press(screen.getByTestId('login-submit'));

    await waitFor(() => expect(screen.getByText('Informe seu e-mail')).toBeTruthy());
  });

  it('calls useAuth().login with the typed credentials on valid submit', async () => {
    const login = jest.fn().mockResolvedValue(undefined);
    (useAuth as jest.Mock).mockReturnValue({ login });
    renderScreen();

    fireEvent.changeText(screen.getByTestId('login-email-input'), 'test@example.com');
    fireEvent.changeText(screen.getByTestId('login-password-input'), '123456');
    fireEvent.press(screen.getByTestId('login-submit'));

    await waitFor(() => expect(login).toHaveBeenCalledWith('test@example.com', '123456'));
  });

  it('shows an error banner when login rejects', async () => {
    const login = jest.fn().mockRejectedValue(new Error('E-mail ou senha incorretos.'));
    (useAuth as jest.Mock).mockReturnValue({ login });
    renderScreen();

    fireEvent.changeText(screen.getByTestId('login-email-input'), 'test@example.com');
    fireEvent.changeText(screen.getByTestId('login-password-input'), '123456');
    fireEvent.press(screen.getByTestId('login-submit'));

    await waitFor(() => expect(screen.getByText('E-mail ou senha incorretos.')).toBeTruthy());
  });
});
