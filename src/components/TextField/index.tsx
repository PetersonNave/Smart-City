import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { colors, fonts, palette } from '../../theme';
import { Icon, type IconName } from '../Icon';

// - pill: campo cinza arredondado das telas de autenticação (Figma "Login").
// - card: campo branco com borda verde dos formulários internos (Figma "Nova demanda").
export type TextFieldVariant = 'pill' | 'card';

const VARIANT_REST_BORDER: Record<TextFieldVariant, string> = {
  pill: 'transparent',
  card: colors.secondary,
};

export type TextFieldProps = {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  onBlur?: () => void;
  error?: string;
  icon?: IconName;
  variant?: TextFieldVariant;
  multiline?: boolean;
  editable?: boolean;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: KeyboardTypeOptions;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function TextField({
  label,
  placeholder,
  value,
  onChangeText,
  onBlur,
  error,
  icon,
  variant = 'pill',
  multiline = false,
  editable = true,
  secureTextEntry = false,
  autoCapitalize = 'none',
  keyboardType = 'default',
  style,
  testID = 'field',
}: TextFieldProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const focusProgress = useSharedValue(0);
  const restBorder = VARIANT_REST_BORDER[variant];
  const animatedBorder = useAnimatedStyle(() => ({
    borderColor: interpolateColor(focusProgress.value, [0, 1], [restBorder, colors.primary]),
  }));
  const isPill = variant === 'pill';
  const isEmpty = value.length === 0;

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={isPill ? styles.pillLabel : styles.cardLabel}>{label}</Text>}
      <Animated.View
        testID={`${testID}-field`}
        style={[
          isPill ? styles.pillField : styles.cardField,
          multiline && styles.multilineField,
          error ? { borderColor: palette.dangerBorder } : animatedBorder,
        ]}
      >
        {icon && <Icon name={icon} size={isPill ? 24 : 20} color={isPill ? palette.inputIcon : colors.primary} />}
        <TextInput
          testID={`${testID}-input`}
          value={value}
          placeholder={placeholder}
          placeholderTextColor={isPill ? palette.inputPlaceholder : palette.textPlaceholder}
          onChangeText={onChangeText}
          onFocus={() => {
            focusProgress.value = withTiming(1, { duration: 150 });
          }}
          onBlur={() => {
            focusProgress.value = withTiming(0, { duration: 150 });
            onBlur?.();
          }}
          editable={editable}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          style={[
            styles.input,
            isPill
              ? isEmpty
                ? styles.pillPlaceholderText
                : styles.pillText
              : multiline && !isEmpty
                ? styles.cardMultilineText
                : styles.cardText,
          ]}
        />
        {secureTextEntry && (
          <Pressable
            testID={`${testID}-toggle`}
            hitSlop={8}
            onPress={() => setIsPasswordVisible((previous) => !previous)}
            accessibilityRole="button"
            accessibilityLabel={isPasswordVisible ? 'Ocultar senha' : 'Mostrar senha'}
          >
            <Icon name={isPasswordVisible ? 'eyeOff' : 'eye'} size={20} color={palette.inputIcon} />
          </Pressable>
        )}
      </Animated.View>
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
  pillLabel: {
    fontFamily: fonts.inter.medium,
    fontSize: 14,
    color: colors.navy,
    marginBottom: 6,
  },
  cardLabel: {
    fontFamily: fonts.inter.semiBold,
    fontSize: 16,
    color: palette.white,
    marginBottom: 8,
    marginLeft: 16,
  },
  pillField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 48,
    borderWidth: 2,
    borderRadius: 50,
    paddingHorizontal: 22,
    backgroundColor: palette.inputBackground,
  },
  cardField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 55,
    borderWidth: 1,
    borderRadius: 15,
    paddingHorizontal: 16,
    backgroundColor: palette.white,
  },
  multilineField: {
    height: 100,
    alignItems: 'flex-start',
    paddingVertical: 14,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  pillText: {
    fontFamily: fonts.inter.medium,
    color: colors.navy,
  },
  pillPlaceholderText: {
    fontFamily: fonts.inter.extraBold,
    color: colors.navy,
  },
  cardText: {
    fontFamily: fonts.inter.bold,
    color: palette.textStrong,
  },
  cardMultilineText: {
    fontFamily: fonts.inter.regular,
    fontSize: 14,
    lineHeight: 20,
    color: palette.textMuted,
  },
  error: {
    fontFamily: fonts.inter.semiBold,
    fontSize: 13,
    color: palette.dangerStrong,
    marginTop: 4,
    marginLeft: 16,
  },
});
