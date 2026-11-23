import { Pressable, Text, View } from 'react-native';
import { palette } from '../../theme';
import { Icon } from '../Icon';

export type ScreenHeaderProps = {
  title: string;
  /** Sem onBack, o espaço do botão fica vazio para manter o título centralizado. */
  onBack?: () => void;
  /**
   * - circle: botão translúcido de 40px e título 20px bold (telas com tab bar).
   * - plain: chevron solto e título 24px extra bold (fluxo de nova demanda).
   */
  variant?: 'circle' | 'plain';
  testID?: string;
};

export function ScreenHeader({ title, onBack, variant = 'circle', testID = 'screen-header' }: ScreenHeaderProps) {
  const isCircle = variant === 'circle';
  const side = isCircle ? 'h-10 w-10' : 'h-8 w-8';

  return (
    <View className="flex-row items-center justify-between gap-3 px-4 py-3" testID={testID}>
      {onBack ? (
        <Pressable
          testID={`${testID}-back`}
          onPress={onBack}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          className={`items-center justify-center active:opacity-70 ${side} ${isCircle ? 'rounded-full bg-headerButton' : ''}`}
        >
          <Icon name="chevronLeft" size={isCircle ? 18 : 28} color={palette.white} strokeWidth={isCircle ? 2.5 : 2} />
        </Pressable>
      ) : (
        <View className={side} />
      )}
      <Text
        className={`flex-1 text-center text-white ${isCircle ? 'font-inter-bold text-xl' : 'font-inter-extrabold text-2xl'}`}
        numberOfLines={1}
        accessibilityRole="header"
      >
        {title}
      </Text>
      <View className={side} />
    </View>
  );
}
