import path from 'path';
import { act, fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { listarDemandas, obterDemanda } from '../api/demandas';
import type { AuthStatus } from '../auth/AuthContext';

// Testa a pasta /app de verdade (rotas, grupos, proteção por sessão e abas).
const APP_DIR = path.resolve(__dirname, '../../app');

jest.mock('expo-font', () => ({ useFonts: () => [true, null] }));
jest.mock('expo-splash-screen', () => ({ preventAutoHideAsync: jest.fn(), hideAsync: jest.fn() }));
jest.mock('../api/demandas');

// Sessão controlável pelo teste: o provider guarda o status em estado React, como o real.
let mockInitialStatus: AuthStatus = 'guest';
let mockSetStatus: (status: AuthStatus) => void = () => {};
jest.mock('../auth/AuthContext', () => {
  const React = require('react');
  const Context = React.createContext(null);
  return {
    AuthProvider: ({ children }: { children: React.ReactNode }) => {
      const [status, setStatus] = React.useState(mockInitialStatus);
      mockSetStatus = setStatus;
      const value = {
        status,
        user: status === 'authenticated' ? { id: 1, name: 'Ana', email: 'ana@example.com', role: 'cidadao' } : null,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
      };
      return <Context.Provider value={value}>{children}</Context.Provider>;
    },
    useAuth: () => React.useContext(Context),
  };
});

const demanda = {
  id: 7,
  title: 'Semáforo danificado',
  description: 'Semáforo apagado há três dias.',
  category: 'PUBLIC_LIGHTING',
  location: 'Rua XV de Novembro, 450',
  status: 'PENDING',
  priority: 'media',
  createdAt: '2026-10-15T12:00:00',
  updatedAt: null,
  photoUrl: null,
};

function renderApp(status: AuthStatus, initialUrl = '/') {
  mockInitialStatus = status;
  return renderRouter(APP_DIR, { initialUrl });
}

describe('app routes (Expo Router)', () => {
  beforeEach(() => {
    (listarDemandas as jest.Mock).mockResolvedValue({
      demandas: [demanda],
      paginacao: { total: 1, paginas: 1, pagina_atual: 1, por_pagina: 10, tem_proxima: false, tem_anterior: false },
    });
    (obterDemanda as jest.Mock).mockResolvedValue(demanda);
  });
  afterEach(() => jest.clearAllMocks());

  it('shows the Figma loading screen while the session is being restored', () => {
    renderApp('bootstrapping');

    expect(screen.getByTestId('loading-logo')).toBeTruthy();
  });

  it.each(['/', '/demandas', '/demandas/7', '/nova-demanda'])(
    'shows the login (auth group) to guests who open %s',
    async (url) => {
      const app = renderApp('guest', url);

      await waitFor(() => expect(screen.getByText('Login')).toBeTruthy());
      expect(app.getSegments()[0]).toBe('(auth)');
      expect(listarDemandas).not.toHaveBeenCalled();
      expect(obterDemanda).not.toHaveBeenCalled();
    }
  );

  it('lets guests go from login to /cadastro', async () => {
    const app = renderApp('guest', '/login');

    fireEvent.press(await screen.findByTestId('go-to-cadastro'));

    await waitFor(() => expect(app.getPathname()).toBe('/cadastro'));
    expect(screen.getByText('Cadastro')).toBeTruthy();
  });

  it('opens the Início tab for logged-in users, with the Figma tab bar', async () => {
    const app = renderApp('authenticated', '/');

    await waitFor(() => expect(screen.getByText('Olá, Ana!')).toBeTruthy());
    expect(app.getPathname()).toBe('/');
    expect(screen.getByTestId('tab-index').props.accessibilityState).toEqual({ selected: true });
  });

  it('keeps logged-in users out of /login', async () => {
    const app = renderApp('authenticated', '/login');

    await waitFor(() => expect(app.getPathname()).toBe('/'));
  });

  it('switches tabs through the custom tab bar', async () => {
    const app = renderApp('authenticated', '/');
    await waitFor(() => expect(screen.getByTestId('tab-demandas')).toBeTruthy());

    fireEvent.press(screen.getByTestId('tab-demandas'));

    await waitFor(() => expect(app.getPathname()).toBe('/demandas'));
    await waitFor(() => expect(screen.getByTestId('demand-card-7')).toBeTruthy());
    expect(screen.getByTestId('tab-demandas').props.accessibilityState).toEqual({ selected: true });
  });

  it('opens /demandas/7 directly with the list underneath, so "back" goes to the list', async () => {
    const app = renderApp('authenticated', '/demandas/7');

    await waitFor(() => expect(screen.getByTestId('detalhe-card')).toBeTruthy());
    expect(obterDemanda).toHaveBeenCalledWith(7);

    fireEvent.press(screen.getByTestId('detalhe-header-back'));

    await waitFor(() => expect(app.getPathname()).toBe('/demandas'));
  });

  it('opens the new-demand flow outside the tabs (no tab bar, as in Figma)', async () => {
    const app = renderApp('authenticated', '/');
    fireEvent.press(await screen.findByTestId('home-nova-demanda'));

    await waitFor(() => expect(app.getPathname()).toBe('/nova-demanda'));
    expect(screen.queryByTestId('tab-bar')).toBeNull();
  });

  it('shows the login when the session ends while using the app (logout / refresh failure)', async () => {
    const app = renderApp('authenticated', '/demandas');
    await waitFor(() => expect(app.getPathname()).toBe('/demandas'));

    act(() => mockSetStatus('guest'));

    await waitFor(() => expect(screen.getByText('Login')).toBeTruthy());
    expect(app.getSegments()[0]).toBe('(auth)');
  });
});
