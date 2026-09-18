import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type KeyboardTypeOptions } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { colors, fonts } from '../../theme';
import { Icon, type IconName } from '../Icon';

const ERROR_COLOR = '#E53935';
const DEFAULT_BORDER = '#E0E0E0';

export type TextFieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  onBlur?: () => void;
  error?: string;
  icon?: IconName;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: KeyboardTypeOptions;
  testID?: string;
};

export function TextField({
  label,
  value,
  onChangeText,
  onBlur,
  error,
  icon,
  secureTextEntry = false,
  autoCapitalize = 'none',
  keyboardType = 'default',
  testID = 'field',
}: TextFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const focusProgress = useSharedValue(0);
  const hasStaticBorder = Boolean(error) || Boolean(value);
  const borderColor = error
    ? ERROR_COLOR
    : value
      ? colors.secondary
      : isFocused
        ? colors.primary
        : DEFAULT_BORDER;
  const animatedStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(focusProgress.value, [0, 1], [DEFAULT_BORDER, colors.primary]),
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Animated.View
        testID={`${testID}-field`}
        style={[styles.field, { borderColor }, !hasStaticBorder && animatedStyle]}
      >
        {icon && <Icon name={icon} size={20} color={borderColor} />}
        <TextInput
          testID={`${testID}-input`}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => {
            setIsFocused(true);
            focusProgress.value = withTiming(1, { duration: 150 });
          }}
          onBlur={() => {
            setIsFocused(false);
            focusProgress.value = withTiming(0, { duration: 150 });
            onBlur?.();
          }}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          style={styles.input}
        />
        {secureTextEntry && (
          <Pressable
            testID={`${testID}-toggle`}
            onPress={() => setIsPasswordVisible((previous) => !previous)}
          >
            <Icon name={isPasswordVisible ? 'eyeOff' : 'eye'} size={20} color={colors.navy} />
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
    marginBottom: 16,
  },
  label: {
    fontFamily: fonts.inter.medium,
    fontSize: 14,
    color: colors.navy,
    marginBottom: 4,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 48,
    borderWidth: 2,
    borderRadius: 24,
    paddingHorizontal: 16,
    backgroundColor: '#F4F4F4',
  },
  input: {
    flex: 1,
    fontFamily: fonts.inter.regular,
    fontSize: 16,
    color: colors.navy,
  },
  error: {
    fontFamily: fonts.inter.medium,
    fontSize: 12,
    color: ERROR_COLOR,
    marginTop: 4,
  },
});
