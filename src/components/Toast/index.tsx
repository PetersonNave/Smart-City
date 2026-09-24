import { useEffect } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { fonts, palette } from '../../theme';
import { Icon } from '../Icon';

export type ToastTone = 'success' | 'warning';

const TONES = {
  success: { background: palette.successSoft, icon: palette.success, text: palette.successStrong, glyph: 'check' },
  warning: { background: palette.warningSoft, icon: palette.warningStrong, text: palette.warningText, glyph: 'alert' },
} as const;

export type ToastProps = {
  message: string | null;
  /** success = Figma "success-toast"; warning = mesmo formato em âmbar (ex.: foto não enviada). */
  tone?: ToastTone;
  /** Chamado após `duration` ms para o dono limpar a mensagem. */
  onHide: () => void;
  duration?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

// Figma "success-toast": fundo verde claro, check num círculo verde, texto verde escuro.
export function Toast({ message, onHide, tone = 'success', duration = 3000, style, testID = 'toast' }: ToastProps) {
  const colorsForTone = TONES[tone];
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onHide, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onHide]);

  if (!message) return null;

  return (
    <Animated.View
      entering={FadeInUp}
      exiting={FadeOutUp}
      style={[styles.toast, { backgroundColor: colorsForTone.background }, style]}
      testID={testID}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <View style={[styles.check, { backgroundColor: colorsForTone.icon }]}>
        <Icon name={colorsForTone.glyph} size={10} color={palette.white} strokeWidth={3} />
      </View>
      <Text style={[styles.text, { color: colorsForTone.text }]}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: palette.successSoft,
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  check: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: palette.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    fontFamily: fonts.inter.bold,
    fontSize: 13,
    color: palette.successStrong,
  },
});
