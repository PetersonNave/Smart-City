import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { useAuth } from '../../auth/AuthContext';
import { createMockRouter } from '../../test-utils/mockRouter';
import { LoginScreen } from './LoginScreen';

jest.mock('../../auth/AuthContext');

const mockRouter = createMockRouter();
jest.mock('expo-router', () => ({ useRouter: () => mockRouter }));

function renderScreen() {
  return render(<LoginScreen />);
}

describe('LoginScreen', () => {
  afterEach(() => jest.clearAllMocks());

  it('goes to /cadastro from the sign-up link', () => {
    (useAuth as jest.Mock).mockReturnValue({ login: jest.fn() });
    renderScreen();

    fireEvent.press(screen.getByTestId('go-to-cadastro'));

    expect(mockRouter.push).toHaveBeenCalledWith('/cadastro');
  });

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

  it('submits from the keyboard "go" key on the password field, with autofill hints set', async () => {
    const login = jest.fn().mockResolvedValue(undefined);
    (useAuth as jest.Mock).mockReturnValue({ login });
    renderScreen();

    expect(screen.getByTestId('login-email-input').props.textContentType).toBe('emailAddress');
    expect(screen.getByTestId('login-password-input').props.autoComplete).toBe('current-password');

    fireEvent.changeText(screen.getByTestId('login-email-input'), 'test@example.com');
    fireEvent.changeText(screen.getByTestId('login-password-input'), '123456');
    fireEvent(screen.getByTestId('login-password-input'), 'submitEditing');

    await waitFor(() => expect(login).toHaveBeenCalledWith('test@example.com', '123456'));
  });
});
