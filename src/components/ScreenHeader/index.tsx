import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fonts, palette } from '../../theme';
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
  const sideSize = isCircle ? 40 : 32;

  return (
    <View style={styles.header} testID={testID}>
      {onBack ? (
        <Pressable
          testID={`${testID}-back`}
          onPress={onBack}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          style={[styles.backButton, { width: sideSize, height: sideSize }, isCircle && styles.backCircle]}
        >
          <Icon name="chevronLeft" size={isCircle ? 18 : 28} color={palette.white} strokeWidth={isCircle ? 2.5 : 2} />
        </Pressable>
      ) : (
        <View style={{ width: sideSize, height: sideSize }} />
      )}
      <Text
        style={[styles.title, isCircle ? styles.titleCircle : styles.titlePlain]}
        numberOfLines={1}
        accessibilityRole="header"
      >
        {title}
      </Text>
      <View style={{ width: sideSize, height: sideSize }} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  backButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  backCircle: {
    borderRadius: 20,
    backgroundColor: palette.headerButton,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    color: palette.white,
  },
  titleCircle: {
    fontFamily: fonts.inter.bold,
    fontSize: 20,
  },
  titlePlain: {
    fontFamily: fonts.inter.extraBold,
    fontSize: 24,
  },
});
