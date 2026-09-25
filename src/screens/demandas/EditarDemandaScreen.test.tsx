import { Alert, Text } from 'react-native';
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';
import { atualizarDemanda, enviarFotoDemanda, obterDemanda } from '../../api/demandas';
import { ApiValidationError } from '../../api/envelope';
import { useAuth } from '../../auth/AuthContext';
import { useCurrentAddress } from '../../hooks/useCurrentAddress';
import { parseEditFeedback } from '../../navigation/routes';
import { EditarDemandaScreen } from './EditarDemandaScreen';

jest.mock('../../api/demandas', () => ({
  ...jest.requireActual('../../api/demandas'),
  obterDemanda: jest.fn(),
  atualizarDemanda: jest.fn(),
  enviarFotoDemanda: jest.fn(),
}));
jest.mock('../../auth/AuthContext');
jest.mock('../../hooks/useCurrentAddress');
// A escolha de foto em si é coberta no teste do PhotoField; aqui só simulamos o resultado.
jest.mock('../../components/PhotoField', () => {
  const { Pressable, Text } = require('react-native');
  return {
    PhotoField: ({
      onChange,
      existingUrl,
      error,
    }: {
      onChange: (foto: object) => void;
      existingUrl?: string | null;
      error?: string;
    }) => (
      <>
        <Pressable testID="editar-foto" onPress={() => onChange({ uri: 'file:///nova.jpg', mimeType: 'image/jpeg' })}>
          <Text>foto atual: {existingUrl ?? 'nenhuma'}</Text>
        </Pressable>
        {error ? <Text>{error}</Text> : null}
      </>
    ),
  };
});

const demanda = {
  id: 7,
  title: 'Semáforo danificado',
  description: 'Semáforo apagado há três dias na esquina.',
  category: 'PUBLIC_LIGHTING',
  location: 'Rua XV de Novembro, 450',
  status: 'PENDING',
  priority: 'media',
  createdAt: '2026-10-15T12:00:00',
  updatedAt: null,
  photoUrl: 'http://api/fotos/atual.jpg',
};

function DetalheStub() {
  const params = useLocalSearchParams<Record<string, string>>();
  const feedback = parseEditFeedback(params);
  return (
    <Text>
      Detalhe {params.id}
      {feedback ? ` loc:${feedback.localizacaoAtualizada} fotoFalhou:${feedback.fotoFalhou}` : ''}
    </Text>
  );
}

// Expo Router real (em memória): /demandas/7 → /demandas/7/editar, para o dismissTo e o
// bloqueio de saída funcionarem como no app.
async function renderScreen() {
  const result = renderRouter(
    {
      _layout: () => <Stack screenOptions={{ headerShown: false }} />,
      'demandas/[id]/index': DetalheStub,
      'demandas/[id]/editar': EditarDemandaScreen,
    },
    { initialUrl: '/demandas/7' }
  );
  await act(async () => {
    router.push('/demandas/7/editar');
  });
  return result;
}

async function waitForForm() {
  await waitFor(() => expect(screen.getByTestId('editar-titulo-input').props.value).toBe('Semáforo danificado'));
}

describe('EditarDemandaScreen', () => {
  const retryGps = jest.fn();

  beforeEach(() => {
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    (useAuth as jest.Mock).mockReturnValue({ user: { id: 1, role: 'cidadao', name: 'Ana' } });
    (useCurrentAddress as jest.Mock).mockReturnValue({ status: 'idle', address: null, retry: retryGps });
    (obterDemanda as jest.Mock).mockResolvedValue(demanda);
    (atualizarDemanda as jest.Mock).mockResolvedValue(demanda);
    (enviarFotoDemanda as jest.Mock).mockResolvedValue(demanda);
  });
  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('pre-fills the form with the current data and photo', async () => {
    await renderScreen();
    await waitForForm();

    expect(screen.getByTestId('editar-descricao-input').props.value).toBe(demanda.description);
    expect(screen.getByTestId('editar-localizacao-input').props.value).toBe(demanda.location);
    expect(screen.getByText('Iluminação pública')).toBeTruthy();
    expect(screen.getByText('foto atual: http://api/fotos/atual.jpg')).toBeTruthy();
  });

  it('PATCHes only the changed fields and returns to the detail with the feedback', async () => {
    await renderScreen();
    await waitForForm();

    fireEvent.changeText(screen.getByTestId('editar-localizacao-input'), 'Av. Brasil, 1200');
    fireEvent.press(screen.getByTestId('editar-atualizar'));

    await waitFor(() => expect(screen.getByText('Detalhe 7 loc:true fotoFalhou:false')).toBeTruthy());
    expect(atualizarDemanda).toHaveBeenCalledWith(7, { localizacao: 'Av. Brasil, 1200' });
    expect(enviarFotoDemanda).not.toHaveBeenCalled();
    expect(Alert.alert).not.toHaveBeenCalled();
  });

  it('uploads a new photo without PATCHing when only the photo changed', async () => {
    await renderScreen();
    await waitForForm();

    fireEvent.press(screen.getByTestId('editar-foto'));
    fireEvent.press(screen.getByTestId('editar-atualizar'));

    await waitFor(() => expect(screen.getByText('Detalhe 7 loc:false fotoFalhou:false')).toBeTruthy());
    expect(enviarFotoDemanda).toHaveBeenCalledWith(7, { uri: 'file:///nova.jpg', mimeType: 'image/jpeg' });
    expect(atualizarDemanda).not.toHaveBeenCalled();
  });

  it('keeps the user on the form with the error when only the photo changed and the upload fails', async () => {
    (enviarFotoDemanda as jest.Mock).mockRejectedValue(
      new ApiValidationError('Arquivo muito grande.', { foto: ['A foto deve ter no máximo 8 MB.'] })
    );
    await renderScreen();
    await waitForForm();

    fireEvent.press(screen.getByTestId('editar-foto'));
    fireEvent.press(screen.getByTestId('editar-atualizar'));

    await waitFor(() => expect(screen.getByText('A foto deve ter no máximo 8 MB.')).toBeTruthy());
    expect(screen.queryByText(/Detalhe 7/)).toBeNull();
  });

  it('saves the text changes and reports the failed photo when both changed', async () => {
    (enviarFotoDemanda as jest.Mock).mockRejectedValue(new Error('Network'));
    await renderScreen();
    await waitForForm();

    fireEvent.changeText(screen.getByTestId('editar-titulo-input'), 'Semáforo quebrado');
    fireEvent.press(screen.getByTestId('editar-foto'));
    fireEvent.press(screen.getByTestId('editar-atualizar'));

    await waitFor(() => expect(screen.getByText('Detalhe 7 loc:false fotoFalhou:true')).toBeTruthy());
    expect(atualizarDemanda).toHaveBeenCalledWith(7, { titulo: 'Semáforo quebrado' });
  });

  it('maps API validation errors onto the fields', async () => {
    (atualizarDemanda as jest.Mock).mockRejectedValue(
      new ApiValidationError('Dados inválidos.', { titulo: ['Já existe uma demanda com este título.'] })
    );
    await renderScreen();
    await waitForForm();

    fireEvent.changeText(screen.getByTestId('editar-titulo-input'), 'Título repetido');
    fireEvent.press(screen.getByTestId('editar-atualizar'));

    await waitFor(() => expect(screen.getByText('Já existe uma demanda com este título.')).toBeTruthy());
  });

  it('fills the location from the GPS only when asked', async () => {
    // Hook com estado de verdade: o GPS só "responde" depois do toque no link.
    (useCurrentAddress as jest.Mock).mockImplementation(() => {
      const React = require('react');
      const [state, setState] = React.useState({ status: 'idle', address: null });
      return {
        ...state,
        retry: () => {
          retryGps();
          setState({ status: 'ready', address: 'Av. Brasil, 1200' });
        },
      };
    });
    await renderScreen();
    await waitForForm();
    expect(screen.getByTestId('editar-localizacao-input').props.value).toBe('Rua XV de Novembro, 450');

    fireEvent.press(screen.getByTestId('editar-usar-gps'));

    expect(retryGps).toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.getByTestId('editar-localizacao-input').props.value).toBe('Av. Brasil, 1200')
    );
  });

  it('cancels without asking when nothing changed, and asks after a change', async () => {
    await renderScreen();
    await waitForForm();

    fireEvent.changeText(screen.getByTestId('editar-descricao-input'), 'Descrição alterada pelo cidadão.');
    fireEvent.press(screen.getByTestId('editar-cancelar'));

    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith('Descartar alterações?', expect.any(String), expect.any(Array))
    );
    expect(screen.queryByText(/Detalhe 7/)).toBeNull();
  });

  it('blocks editing when the demand is no longer pending', async () => {
    (obterDemanda as jest.Mock).mockResolvedValue({ ...demanda, status: 'IN_PROGRESS' });
    await renderScreen();

    await waitFor(() => expect(screen.getByTestId('editar-bloqueado')).toBeTruthy());
    expect(screen.queryByTestId('editar-atualizar')).toBeNull();
  });
});
