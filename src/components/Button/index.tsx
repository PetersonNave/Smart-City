import { Pressable, StyleSheet, Text, type GestureResponderEvent } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { colors, fonts } from '../../theme';
import { Loading } from '../Loading';

export type ButtonVariant = 'primary' | 'secondary';

export type ButtonProps = {
  label: string;
  onPress: (event: GestureResponderEvent) => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  testID?: string;
};

const variantColors: Record<ButtonVariant, string> = {
  primary: colors.primary,
  secondary: colors.secondary,
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  testID,
}: ButtonProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const isInteractive = !disabled && !loading;

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        testID={testID}
        onPress={isInteractive ? onPress : undefined}
        disabled={!isInteractive}
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
          { backgroundColor: variantColors[variant] },
          !isInteractive && styles.disabled,
        ]}
      >
        {loading ? <Loading size="small" color="#fff" /> : <Text style={styles.label}>{label}</Text>}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontFamily: fonts.inter.bold,
    fontSize: 16,
    color: '#fff',
  },
});
