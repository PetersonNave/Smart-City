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

async function fillValidForm() {
  await fireEvent.changeText(screen.getByTestId('cadastro-username-input'), 'testuser');
  await fireEvent.changeText(screen.getByTestId('cadastro-email-input'), 'test@example.com');
  await fireEvent.changeText(screen.getByTestId('cadastro-password-input'), '123456');
  await fireEvent.changeText(screen.getByTestId('cadastro-confirmPassword-input'), '123456');
}

describe('CadastroScreen', () => {
  afterEach(async () => jest.clearAllMocks());

  it('shows a validation error when passwords do not match', async () => {
    (useAuth as jest.Mock).mockReturnValue({ register: jest.fn() });
    await renderScreen();

    await fillValidForm();
    await fireEvent.changeText(screen.getByTestId('cadastro-confirmPassword-input'), 'different');
    await fireEvent.press(screen.getByTestId('cadastro-submit'));

    await waitFor(() => expect(screen.getByText('As senhas não coincidem')).toBeTruthy());
  });

  it('calls useAuth().register with the typed data on valid submit', async () => {
    const register = jest.fn().mockResolvedValue(undefined);
    (useAuth as jest.Mock).mockReturnValue({ register });
    await renderScreen();

    await fillValidForm();
    await fireEvent.press(screen.getByTestId('cadastro-submit'));

    await waitFor(() => expect(register).toHaveBeenCalledWith('testuser', 'test@example.com', '123456'));
  });

  it('maps a duplicate-email API error onto the email field', async () => {
    const register = jest
      .fn()
      .mockRejectedValue(
        new ApiValidationError('Erro de validação', { email: ['E-mail já cadastrado.'] })
      );
    (useAuth as jest.Mock).mockReturnValue({ register });
    await renderScreen();

    await fillValidForm();
    await fireEvent.press(screen.getByTestId('cadastro-submit'));

    await waitFor(() => expect(screen.getByText('E-mail já cadastrado.')).toBeTruthy());
  });
});

describe('CadastroScreen navigation', () => {
  beforeEach(async () => (useAuth as jest.Mock).mockReturnValue({ register: jest.fn() }));
  afterEach(async () => jest.clearAllMocks());

  it('goes back to the login it came from', async () => {
    mockRouter.canGoBack.mockReturnValue(true);
    await renderScreen();

    await fireEvent.press(screen.getByTestId('go-to-login'));

    expect(mockRouter.back).toHaveBeenCalled();
  });

  it('opens /login when there is nothing to go back to (deep link straight to /cadastro)', async () => {
    mockRouter.canGoBack.mockReturnValue(false);
    await renderScreen();

    await fireEvent.press(screen.getByTestId('go-to-login'));

    expect(mockRouter.replace).toHaveBeenCalledWith('/login');
  });
});
