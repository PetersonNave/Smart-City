import { Alert } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as ImagePicker from 'expo-image-picker';
import { PhotoField } from './index';

jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

type AlertButtons = Parameters<typeof Alert.alert>[2];

function pressAlertOption(label: string) {
  const buttons = (Alert.alert as jest.Mock).mock.calls.at(-1)[2] as AlertButtons;
  buttons?.find((button) => button.text === label)?.onPress?.();
}

describe('PhotoField', () => {
  beforeEach(() => {
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());

  it('shows the "Adicionar foto" empty state and the error message', () => {
    render(<PhotoField value={null} onChange={jest.fn()} error="Anexe ao menos uma foto" />);

    expect(screen.getByText('Adicionar foto')).toBeTruthy();
    expect(screen.getByText('Anexe ao menos uma foto')).toBeTruthy();
  });

  it('picks an image from the library and reports its uri', async () => {
    (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({ granted: true });
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///foto.jpg' }],
    });
    const onChange = jest.fn();
    render(<PhotoField value={null} onChange={onChange} />);

    fireEvent.press(screen.getByTestId('photo-field'));
    pressAlertOption('Escolher da galeria');

    await waitFor(() => expect(onChange).toHaveBeenCalledWith('file:///foto.jpg'));
  });

  it('does not open the camera when permission is denied', async () => {
    (ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({ granted: false });
    const onChange = jest.fn();
    render(<PhotoField value={null} onChange={onChange} />);

    fireEvent.press(screen.getByTestId('photo-field'));
    pressAlertOption('Tirar foto');

    await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith('Permissão necessária', expect.any(String)));
    expect(ImagePicker.launchCameraAsync).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('shows the preview with "Alterar foto" once a photo is set', () => {
    render(<PhotoField value="file:///foto.jpg" onChange={jest.fn()} />);

    expect(screen.getByTestId('photo-field-preview')).toBeTruthy();
    expect(screen.getByText('Alterar foto')).toBeTruthy();
  });
});
