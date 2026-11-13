import { fireEvent, render, screen } from '@testing-library/react-native';
import { useAuth } from '../../auth/AuthContext';
import { PerfilScreen } from './PerfilScreen';

jest.mock('../../auth/AuthContext');

describe('PerfilScreen', () => {
  afterEach(() => jest.clearAllMocks());

  it('shows the citizen profile and logs out', () => {
    const logout = jest.fn();
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 1, name: 'Ana', email: 'ana@example.com', role: 'cidadao', createdAt: '2026-10-01T10:00:00' },
      logout,
    });

    render(<PerfilScreen />);

    expect(screen.getByText('Ana')).toBeTruthy();
    expect(screen.getByText('ana@example.com')).toBeTruthy();
    expect(screen.getByText('Cidadão')).toBeTruthy();
    fireEvent.press(screen.getByTestId('perfil-logout'));
    expect(logout).toHaveBeenCalled();
  });

  it('identifies the public manager profile', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 2, name: 'Gestora', email: 'g@prefeitura.gov.br', role: 'gestor', createdAt: '2026-10-01T10:00:00' },
      logout: jest.fn(),
    });

    render(<PerfilScreen />);

    expect(screen.getByText('Gestor Público')).toBeTruthy();
  });
});
