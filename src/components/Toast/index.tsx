import { useEffect } from 'react';
import { Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { palette } from '../../theme';
import { Icon } from '../Icon';

export type ToastTone = 'success' | 'warning';

// Classes por tom: o NativeWind precisa ver os nomes completos no código para gerá-las.
const TONES = {
  success: { box: 'bg-successSoft border-success/30', dot: 'bg-success', text: 'text-successStrong', glyph: 'check' },
  warning: { box: 'bg-warningSoft border-warningStrong/30', dot: 'bg-warningStrong', text: 'text-warningText', glyph: 'alert' },
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
  const toneClasses = TONES[tone];
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
      style={style}
      testID={testID}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <View className={`flex-row items-center gap-2.5 rounded-xl border px-4 py-2.5 shadow-sm ${toneClasses.box}`}>
        <View className={`h-[18px] w-[18px] items-center justify-center rounded-full ${toneClasses.dot}`}>
          <Icon name={toneClasses.glyph} size={10} color={palette.white} strokeWidth={3} />
        </View>
        <Text className={`flex-1 font-inter-bold text-[13px] ${toneClasses.text}`}>{message}</Text>
      </View>
    </Animated.View>
  );
}
