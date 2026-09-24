import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import type { DemandaCategoria } from '../../api/demandas';
import { CATEGORIA_ICONS } from '../../domain/demanda';
import { colors, palette } from '../../theme';
import { Icon } from '../Icon';

export type DemandThumbProps = {
  category: DemandaCategoria;
  iconSize?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

// No Figma a miniatura é a foto da demanda; a API ainda não armazena fotos,
// então mostramos o ícone da categoria no mesmo espaço (64×64, raio 10).
export function DemandThumb({ category, iconSize = 28, style, testID }: DemandThumbProps) {
  return (
    <View testID={testID} style={[styles.thumb, style]} accessibilityElementsHidden importantForAccessibility="no">
      <Icon name={CATEGORIA_ICONS[category]} size={iconSize} color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: palette.infoSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
