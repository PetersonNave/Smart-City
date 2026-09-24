import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, palette, withAlpha } from '../../theme';

export type GradientVariant = 'brand' | 'screen';

// Gradientes exatos do Figma (ambos com 90% de opacidade sobre fundo branco):
// - brand: vertical verde → teal → navy (Loading e Login).
// - screen: 155° teal → verde (telas internas, ex.: Demandas).
const GRADIENTS = {
  brand: {
    colors: [withAlpha(colors.secondary, 0.9), withAlpha(colors.primary, 0.9), withAlpha(colors.navy, 0.9)],
    locations: [0.207, 0.501, 0.998],
    start: { x: 0.5, y: 0 },
    end: { x: 0.5, y: 1 },
  },
  screen: {
    colors: [withAlpha(colors.primary, 0.9), withAlpha(colors.secondary, 0.9)],
    locations: [0.036, 1],
    start: { x: 0.289, y: 0.047 },
    end: { x: 0.711, y: 0.953 },
  },
} as const;

export type GradientBackgroundProps = {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: GradientVariant;
  testID?: string;
};

export function GradientBackground({ children, style, variant = 'brand', testID }: GradientBackgroundProps) {
  const gradient = GRADIENTS[variant];

  return (
    <LinearGradient
      testID={testID}
      colors={gradient.colors}
      locations={gradient.locations}
      start={gradient.start}
      end={gradient.end}
      style={[styles.fill, style]}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: palette.white },
});
