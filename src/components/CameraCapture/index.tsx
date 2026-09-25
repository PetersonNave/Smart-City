import { useRef, useState } from 'react';
import { Image, Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions, type CameraType } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { FotoLocal } from '../../api/demandas';
import { colors, fonts, palette } from '../../theme';
import { Button } from '../Button';
import { Icon } from '../Icon';
import { Loading } from '../Loading';

export type CameraCaptureProps = {
  visible: boolean;
  onCapture: (foto: FotoLocal) => void;
  onClose: () => void;
  testID?: string;
};

// Qualidade suficiente para ver o problema e ficar bem abaixo do limite de 8 MB do backend.
const PICTURE_QUALITY = 0.7;

/**
 * Câmera do app (expo-camera) em tela cheia: pede a permissão, mostra a prévia ao vivo,
 * permite trocar entre câmera traseira/frontal e confirmar a foto antes de usá-la.
 */
export function CameraCapture({ visible, onCapture, onClose, testID = 'camera' }: CameraCaptureProps) {
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [isReady, setIsReady] = useState(false);
  const [isTaking, setIsTaking] = useState(false);
  const [preview, setPreview] = useState<FotoLocal | null>(null);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setPreview(null);
    setError(null);
    setIsReady(false);
    setIsTaking(false);
  }

  function close() {
    reset();
    onClose();
  }

  async function takePicture() {
    if (!cameraRef.current || !isReady || isTaking) return;
    setIsTaking(true);
    setError(null);
    try {
      const picture = await cameraRef.current.takePictureAsync({ quality: PICTURE_QUALITY });
      setPreview({ uri: picture.uri, mimeType: picture.format === 'png' ? 'image/png' : 'image/jpeg' });
    } catch {
      setError('Não foi possível tirar a foto. Tente novamente.');
    } finally {
      setIsTaking(false);
    }
  }

  function confirm() {
    if (!preview) return;
    const foto = preview;
    reset();
    onCapture(foto);
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={close} statusBarTranslucent>
      <View style={styles.screen} testID={testID}>
        {!permission ? (
          <View style={styles.centered}>
            <Loading color={palette.white} />
          </View>
        ) : !permission.granted ? (
          <View style={[styles.centered, styles.padded]} testID={`${testID}-permission`}>
            <Icon name="camera" size={48} color={palette.white} />
            <Text style={styles.title}>Permita o acesso à câmera</Text>
            <Text style={styles.message}>
              O ResolveAí usa a câmera para você fotografar o problema que está registrando.
            </Text>
            {permission.canAskAgain ? (
              <Button label="Permitir câmera" onPress={requestPermission} testID={`${testID}-permitir`} />
            ) : (
              <Button
                label="Abrir configurações"
                onPress={() => Linking.openSettings()}
                testID={`${testID}-configuracoes`}
              />
            )}
            <Pressable onPress={close} hitSlop={10} accessibilityRole="button" testID={`${testID}-cancelar`}>
              <Text style={styles.link}>Agora não</Text>
            </Pressable>
          </View>
        ) : preview ? (
          <View style={styles.fill} testID={`${testID}-preview`}>
            <Image source={{ uri: preview.uri }} style={styles.fill} resizeMode="contain" />
            <View style={[styles.previewActions, { paddingBottom: insets.bottom + 24 }]}>
              <Button
                label="Tirar outra"
                variant="outline"
                radius={15}
                onPress={() => setPreview(null)}
                style={styles.previewAction}
                testID={`${testID}-refazer`}
              />
              <Button
                label="Usar foto"
                radius={15}
                onPress={confirm}
                style={styles.previewAction}
                testID={`${testID}-usar`}
              />
            </View>
          </View>
        ) : (
          <View style={styles.fill}>
            <CameraView
              ref={cameraRef}
              style={styles.fill}
              facing={facing}
              mode="picture"
              onCameraReady={() => setIsReady(true)}
              onMountError={() => setError('Não foi possível abrir a câmera.')}
              testID={`${testID}-view`}
            />
            <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
              <Pressable
                onPress={close}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Fechar câmera"
                style={styles.roundButton}
                testID={`${testID}-fechar`}
              >
                <Icon name="close" size={24} color={palette.white} />
              </Pressable>
            </View>
            {error && (
              <Text style={styles.error} testID={`${testID}-erro`}>
                {error}
              </Text>
            )}
            <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 28 }]}>
              <View style={styles.sideSlot} />
              <Pressable
                onPress={takePicture}
                disabled={!isReady || isTaking}
                accessibilityRole="button"
                accessibilityLabel="Tirar foto"
                accessibilityState={{ disabled: !isReady || isTaking, busy: isTaking }}
                style={[styles.shutter, (!isReady || isTaking) && styles.shutterDisabled]}
                testID={`${testID}-disparar`}
              >
                {isTaking ? <Loading size="small" color={colors.primary} /> : <View style={styles.shutterInner} />}
              </Pressable>
              <Pressable
                onPress={() => setFacing((current) => (current === 'back' ? 'front' : 'back'))}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={facing === 'back' ? 'Usar câmera frontal' : 'Usar câmera traseira'}
                style={styles.roundButton}
                testID={`${testID}-alternar`}
              >
                <Icon name="rotateCw" size={24} color={palette.white} />
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000',
  },
  fill: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  padded: {
    paddingHorizontal: 32,
  },
  title: {
    fontFamily: fonts.inter.extraBold,
    fontSize: 20,
    color: palette.white,
    textAlign: 'center',
  },
  message: {
    fontFamily: fonts.inter.medium,
    fontSize: 15,
    lineHeight: 21,
    color: palette.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  link: {
    fontFamily: fonts.inter.bold,
    fontSize: 15,
    color: palette.white,
    textDecorationLine: 'underline',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    flexDirection: 'row',
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sideSlot: {
    width: 48,
  },
  roundButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterDisabled: {
    opacity: 0.5,
  },
  shutterInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: palette.white,
  },
  error: {
    position: 'absolute',
    alignSelf: 'center',
    top: '45%',
    fontFamily: fonts.inter.semiBold,
    fontSize: 14,
    color: palette.white,
    backgroundColor: palette.danger,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    overflow: 'hidden',
  },
  previewActions: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  previewAction: {
    flex: 1,
    width: undefined,
  },
});
