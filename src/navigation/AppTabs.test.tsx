import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { AppTabs } from './AppTabs';
import { useAuth } from '../auth/AuthContext';
import { listarDemandas } from '../api/demandas';

jest.mock('../auth/AuthContext');
jest.mock('../api/demandas');

function renderTabs() {
  return render(
    <NavigationContainer>
      <AppTabs />
    </NavigationContainer>
  );
}

describe('AppTabs', () => {
  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({ user: null, logout: jest.fn() });
    (listarDemandas as jest.Mock).mockResolvedValue({
      demandas: [],
      paginacao: { total: 0, paginas: 0, pagina_atual: 1, por_pagina: 10, tem_proxima: false, tem_anterior: false },
    });
  });

  it('renders the custom tab bar with the four Figma tabs, Início selected', () => {
    renderTabs();

    expect(screen.getByTestId('tab-bar')).toBeTruthy();
    expect(screen.getByTestId('tab-Inicio').props.accessibilityState).toEqual({ selected: true });
    expect(screen.getByText('Mapa')).toBeTruthy();
    expect(screen.getByText('Demandas')).toBeTruthy();
    expect(screen.getByText('Perfil')).toBeTruthy();
  });

  it('switches to the Demandas tab and loads the list', async () => {
    renderTabs();

    fireEvent.press(screen.getByTestId('tab-Demandas'));

    await waitFor(() => expect(screen.getByTestId('demandas-empty')).toBeTruthy());
    expect(screen.getByTestId('tab-Demandas').props.accessibilityState).toEqual({ selected: true });
  });
});
