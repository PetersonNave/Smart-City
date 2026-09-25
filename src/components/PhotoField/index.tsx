import { useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { FotoLocal } from '../../api/demandas';
import { colors, fonts, palette } from '../../theme';
import { CameraCapture } from '../CameraCapture';
import { Icon } from '../Icon';

export type PhotoFieldProps = {
  /** Foto escolhida agora no aparelho (ainda não enviada). */
  value: FotoLocal | null;
  /** Foto já salva na API (tela de edição); aparece enquanto nenhuma nova for escolhida. */
  existingUrl?: string | null;
  onChange: (foto: FotoLocal) => void;
  error?: string;
  testID?: string;
};

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  allowsEditing: true,
  aspect: [16, 9],
  quality: 0.7,
};

/** Galeria via expo-image-picker (a câmera é a do próprio app, em CameraCapture). */
async function pickFromLibrary(): Promise<FotoLocal | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('Permissão necessária', 'Autorize o acesso às fotos nas configurações para anexar uma imagem.');
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
  const asset = result.canceled ? undefined : result.assets[0];
  return asset ? { uri: asset.uri, mimeType: asset.mimeType ?? null } : null;
}

// Figma "field-photo": card de 150px com "Adicionar foto"; com foto, mostra a
// imagem com o selo "Alterar foto" (mesmo padrão do frame "Editar Demanda").
export function PhotoField({ value, existingUrl, onChange, error, testID = 'photo-field' }: PhotoFieldProps) {
  const previewUri = value?.uri ?? existingUrl ?? null;
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  function chooseFromLibrary() {
    pickFromLibrary()
      .then((foto) => {
        if (foto) onChange(foto);
      })
      .catch(() => Alert.alert('Não foi possível abrir a galeria', 'Tente novamente.'));
  }

  function handlePress() {
    Alert.alert('Adicionar foto', 'Como você quer anexar a foto do problema?', [
      { text: 'Tirar foto', onPress: () => setIsCameraOpen(true) },
      { text: 'Escolher da galeria', onPress: chooseFromLibrary },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }

  return (
    <View style={styles.container}>
      <Pressable
        testID={testID}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={previewUri ? 'Alterar foto' : 'Adicionar foto'}
        style={[styles.card, error ? styles.cardError : null]}
      >
        {previewUri ? (
          <>
            <Image source={{ uri: previewUri }} style={styles.image} testID={`${testID}-preview`} />
            <View style={styles.imageShade} />
            <View style={styles.changeBadge}>
              <Icon name="camera" size={24} color={palette.text} />
              <Text style={styles.changeText}>Alterar foto</Text>
            </View>
          </>
        ) : (
          <View style={styles.empty}>
            <Icon name="camera" size={24} color={palette.textStrong} />
            <Text style={styles.emptyText}>Adicionar foto</Text>
          </View>
        )}
      </Pressable>
      {error && (
        <Text testID={`${testID}-error`} style={styles.error}>
          {error}
        </Text>
      )}
      <CameraCapture
        visible={isCameraOpen}
        onCapture={(foto) => {
          setIsCameraOpen(false);
          onChange(foto);
        }}
        onClose={() => setIsCameraOpen(false)}
        testID={`${testID}-camera`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  card: {
    height: 150,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.secondary,
    backgroundColor: palette.white,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardError: {
    borderColor: palette.dangerBorder,
  },
  empty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontFamily: fonts.inter.bold,
    fontSize: 16,
    color: palette.textStrong,
  },
  image: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  // Figma "photo-preview" + "camera-overlay": foto escurecida 25% e selo branco translúcido.
  imageShade: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  changeText: {
    fontFamily: fonts.inter.bold,
    fontSize: 13,
    color: palette.text,
  },
  error: {
    fontFamily: fonts.inter.semiBold,
    fontSize: 13,
    color: palette.dangerStrong,
    marginTop: 4,
    marginLeft: 16,
  },
});
