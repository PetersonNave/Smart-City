import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, fonts, palette } from '../../theme';
import { Icon } from '../Icon';

export type PhotoFieldProps = {
  value: string | null;
  onChange: (uri: string) => void;
  error?: string;
  testID?: string;
};

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  allowsEditing: true,
  aspect: [16, 9],
  quality: 0.7,
};

async function pickFrom(source: 'camera' | 'library'): Promise<string | null> {
  const permission =
    source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    Alert.alert(
      'Permissão necessária',
      source === 'camera'
        ? 'Autorize o acesso à câmera nas configurações para fotografar o problema.'
        : 'Autorize o acesso às fotos nas configurações para anexar uma imagem.'
    );
    return null;
  }

  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync(PICKER_OPTIONS)
      : await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);

  return result.canceled ? null : result.assets[0]?.uri ?? null;
}

// Figma "field-photo": card de 150px com "Adicionar foto"; com foto, mostra a
// imagem com o selo "Alterar foto" (mesmo padrão do frame "Editar Demanda").
export function PhotoField({ value, onChange, error, testID = 'photo-field' }: PhotoFieldProps) {
  function choose(source: 'camera' | 'library') {
    pickFrom(source)
      .then((uri) => {
        if (uri) onChange(uri);
      })
      .catch(() => Alert.alert('Não foi possível abrir a câmera/galeria', 'Tente novamente.'));
  }

  function handlePress() {
    Alert.alert('Adicionar foto', 'Como você quer anexar a foto do problema?', [
      { text: 'Tirar foto', onPress: () => choose('camera') },
      { text: 'Escolher da galeria', onPress: () => choose('library') },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }

  return (
    <View style={styles.container}>
      <Pressable
        testID={testID}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={value ? 'Alterar foto' : 'Adicionar foto'}
        style={[styles.card, error ? styles.cardError : null]}
      >
        {value ? (
          <>
            <Image source={{ uri: value }} style={styles.image} testID={`${testID}-preview`} />
            <View style={styles.changeBadge}>
              <Icon name="camera" size={20} color={palette.textStrong} />
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
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  changeText: {
    fontFamily: fonts.inter.bold,
    fontSize: 14,
    color: palette.textStrong,
  },
  error: {
    fontFamily: fonts.inter.semiBold,
    fontSize: 13,
    color: palette.dangerStrong,
    marginTop: 4,
    marginLeft: 16,
  },
});
