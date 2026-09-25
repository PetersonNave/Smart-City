import { Linking } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { useCameraPermissions } from 'expo-camera';
import { CameraCapture } from './index';

const mockTakePicture = jest.fn();

// O expo-camera é nativo: no Jest, CameraView vira uma View que expõe takePictureAsync pelo ref
// e dispara onCameraReady ao montar, como a câmera real faz.
jest.mock('expo-camera', () => {
  const React = require('react');
  const { View } = require('react-native');
  const CameraView = React.forwardRef(
    ({ onCameraReady, ...props }: { onCameraReady?: () => void }, ref: React.Ref<unknown>) => {
      React.useImperativeHandle(ref, () => ({ takePictureAsync: mockTakePicture }));
      React.useEffect(() => {
        onCameraReady?.();
      }, []);
      return <View {...props} />;
    }
  );
  return { CameraView, useCameraPermissions: jest.fn() };
});

const requestPermission = jest.fn();

function grant(granted: boolean, canAskAgain = true) {
  (useCameraPermissions as jest.Mock).mockReturnValue([{ granted, canAskAgain }, requestPermission]);
}

describe('CameraCapture', () => {
  afterEach(() => jest.clearAllMocks());

  it('asks for the camera permission when it was not granted yet', () => {
    grant(false);
    render(<CameraCapture visible onCapture={jest.fn()} onClose={jest.fn()} />);

    fireEvent.press(screen.getByTestId('camera-permitir'));

    expect(requestPermission).toHaveBeenCalled();
    expect(screen.queryByTestId('camera-view')).toBeNull();
  });

  it('sends the user to the settings when the permission was permanently denied', () => {
    grant(false, false);
    const openSettings = jest.spyOn(Linking, 'openSettings').mockResolvedValue(undefined);
    render(<CameraCapture visible onCapture={jest.fn()} onClose={jest.fn()} />);

    fireEvent.press(screen.getByTestId('camera-configuracoes'));

    expect(openSettings).toHaveBeenCalled();
    openSettings.mockRestore();
  });

  it('takes a picture, shows the preview and returns it on "Usar foto"', async () => {
    grant(true);
    mockTakePicture.mockResolvedValue({ uri: 'file:///cache/Camera/foto.jpg', width: 10, height: 10, format: 'jpg' });
    const onCapture = jest.fn();
    render(<CameraCapture visible onCapture={onCapture} onClose={jest.fn()} />);

    fireEvent.press(screen.getByTestId('camera-disparar'));

    await waitFor(() => expect(screen.getByTestId('camera-preview')).toBeTruthy());
    expect(mockTakePicture).toHaveBeenCalledWith({ quality: 0.7 });

    fireEvent.press(screen.getByTestId('camera-usar'));
    expect(onCapture).toHaveBeenCalledWith({ uri: 'file:///cache/Camera/foto.jpg', mimeType: 'image/jpeg' });
  });

  it('goes back to the live camera on "Tirar outra"', async () => {
    grant(true);
    mockTakePicture.mockResolvedValue({ uri: 'file:///a.jpg', width: 1, height: 1, format: 'jpg' });
    render(<CameraCapture visible onCapture={jest.fn()} onClose={jest.fn()} />);

    fireEvent.press(screen.getByTestId('camera-disparar'));
    await waitFor(() => expect(screen.getByTestId('camera-refazer')).toBeTruthy());
    fireEvent.press(screen.getByTestId('camera-refazer'));

    expect(screen.getByTestId('camera-view')).toBeTruthy();
  });

  it('switches between the back and front cameras', () => {
    grant(true);
    render(<CameraCapture visible onCapture={jest.fn()} onClose={jest.fn()} />);
    expect(screen.getByTestId('camera-view').props.facing).toBe('back');

    fireEvent.press(screen.getByTestId('camera-alternar'));

    expect(screen.getByTestId('camera-view').props.facing).toBe('front');
  });

  it('shows an error if taking the picture fails, and closes from the X', async () => {
    grant(true);
    mockTakePicture.mockRejectedValue(new Error('hardware'));
    const onClose = jest.fn();
    render(<CameraCapture visible onCapture={jest.fn()} onClose={onClose} />);

    fireEvent.press(screen.getByTestId('camera-disparar'));
    await waitFor(() => expect(screen.getByTestId('camera-erro')).toBeTruthy());

    fireEvent.press(screen.getByTestId('camera-fechar'));
    expect(onClose).toHaveBeenCalled();
  });
});
