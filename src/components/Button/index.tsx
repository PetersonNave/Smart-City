import {
  Pressable,
  StyleSheet,
  Text,
  type GestureResponderEvent,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { colors, fonts, palette } from '../../theme';
import { Icon, type IconName } from '../Icon';
import { Loading } from '../Loading';

// - primary / secondary: botões pill cheios (telas de autenticação).
// - surface: branco com borda verde, raio 15, 55px (Figma "Nova demanda" / "Demanda enviada").
// - outline: branco com borda teal de 2px (Figma "Cancelar" / "Editar Demanda").
// - danger: vermelho cheio (Figma "Excluir").
export type ButtonVariant = 'primary' | 'secondary' | 'surface' | 'outline' | 'danger';

export type ButtonProps = {
  label: string;
  onPress: (event: GestureResponderEvent) => void;
  variant?: ButtonVariant;
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  /** Sobrescreve o raio da variante (ex.: 15 nos botões da tela "Editar Demanda"). */
  radius?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

const VARIANT_STYLES: Record<ButtonVariant, { container: ViewStyle; label: TextStyle; content: string }> = {
  primary: {
    container: { backgroundColor: colors.primary, borderRadius: 50, minHeight: 48 },
    label: { fontFamily: fonts.inter.bold, color: palette.white },
    content: palette.white,
  },
  secondary: {
    container: { backgroundColor: colors.secondary, borderRadius: 50, minHeight: 48 },
    label: { fontFamily: fonts.inter.bold, color: palette.white },
    content: palette.white,
  },
  surface: {
    container: {
      backgroundColor: palette.white,
      borderColor: colors.secondary,
      borderWidth: 1,
      borderRadius: 15,
      minHeight: 55,
    },
    label: { fontFamily: fonts.inter.extraBold, color: colors.primary },
    content: colors.primary,
  },
  outline: {
    container: {
      backgroundColor: palette.white,
      borderColor: colors.primary,
      borderWidth: 2,
      borderRadius: 12,
      minHeight: 50,
    },
    label: { fontFamily: fonts.inter.extraBold, color: colors.primary },
    content: colors.primary,
  },
  danger: {
    container: { backgroundColor: palette.danger, borderRadius: 12, minHeight: 50 },
    label: { fontFamily: fonts.inter.extraBold, color: palette.white },
    content: palette.white,
  },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled = false,
  loading = false,
  radius,
  style,
  testID,
}: ButtonProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const isInteractive = !disabled && !loading;
  const variantStyle = VARIANT_STYLES[variant];

  return (
    <Animated.View style={[styles.wrapper, animatedStyle, style]}>
      <Pressable
        testID={testID}
        onPress={isInteractive ? onPress : undefined}
        disabled={!isInteractive}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: !isInteractive, busy: loading }}
        onPressIn={() => {
          if (isInteractive) {
            scale.value = withTiming(0.96, { duration: 100 });
          }
        }}
        onPressOut={() => {
          scale.value = withTiming(1, { duration: 100 });
        }}
        style={[
          styles.base,
          variantStyle.container,
          radius !== undefined && { borderRadius: radius },
          !isInteractive && styles.disabled,
        ]}
      >
        {loading ? (
          <Loading size="small" color={variantStyle.content} />
        ) : (
          <>
            {icon && <Icon name={icon} size={20} color={variantStyle.content} />}
            <Text style={[styles.label, variantStyle.label]}>{label}</Text>
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  base: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontSize: 16,
  },
});
