import { useState } from 'react';
import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import type { DemandaCategoria } from '../../api/demandas';
import { CATEGORIA_ICONS } from '../../domain/demanda';
import { colors, palette } from '../../theme';
import { Icon } from '../Icon';

export type DemandThumbProps = {
  category: DemandaCategoria;
  photoUrl?: string | null;
  iconSize?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

// Figma "card-thumb": foto da demanda (64×64, raio 10). Sem foto — ou se ela falhar ao
// carregar — mostra o ícone da categoria no mesmo espaço.
export function DemandThumb({ category, photoUrl, iconSize = 28, style, testID }: DemandThumbProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showPhoto = Boolean(photoUrl) && failedUrl !== photoUrl;

  return (
    <View
      testID={testID}
      style={[styles.thumb, style]}
      // O ícone de categoria é decorativo; a foto é conteúdo e fica acessível.
      accessibilityElementsHidden={!showPhoto}
      importantForAccessibility={showPhoto ? 'auto' : 'no-hide-descendants'}
    >
      {showPhoto ? (
        <Image
          accessible
          accessibilityRole="image"
          accessibilityLabel="Foto da demanda"
          source={{ uri: photoUrl as string }}
          style={styles.photo}
          resizeMode="cover"
          onError={() => setFailedUrl(photoUrl ?? null)}
          testID={testID ? `${testID}-photo` : undefined}
        />
      ) : (
        <Icon name={CATEGORIA_ICONS[category]} size={iconSize} color={colors.primary} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: palette.infoSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
});
