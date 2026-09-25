import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { ApiValidationError } from '../../api/auth';
import { useAuth } from '../../auth/AuthContext';
import { createMockRouter } from '../../test-utils/mockRouter';
import { CadastroScreen } from './CadastroScreen';

jest.mock('../../auth/AuthContext');

const mockRouter = createMockRouter();
jest.mock('expo-router', () => ({ useRouter: () => mockRouter }));

function renderScreen() {
  return render(<CadastroScreen />);
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

describe('CadastroScreen navigation', () => {
  beforeEach(() => (useAuth as jest.Mock).mockReturnValue({ register: jest.fn() }));
  afterEach(() => jest.clearAllMocks());

  it('goes back to the login it came from', () => {
    mockRouter.canGoBack.mockReturnValue(true);
    renderScreen();

    fireEvent.press(screen.getByTestId('go-to-login'));

    expect(mockRouter.back).toHaveBeenCalled();
  });

  it('opens /login when there is nothing to go back to (deep link straight to /cadastro)', () => {
    mockRouter.canGoBack.mockReturnValue(false);
    renderScreen();

    fireEvent.press(screen.getByTestId('go-to-login'));

    expect(mockRouter.replace).toHaveBeenCalledWith('/login');
  });
});
