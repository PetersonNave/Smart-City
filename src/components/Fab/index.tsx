import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { colors, palette } from '../../theme';
import { Icon, type IconName } from '../Icon';

export type FabProps = {
  onPress: () => void;
  accessibilityLabel: string;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

// Figma "floating-action-button": 56px, verde secundário, ícone "+" branco.
export function Fab({ onPress, accessibilityLabel, icon = 'plus', style, testID = 'fab' }: FabProps) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.fab, pressed && styles.pressed, style]}
    >
      <Icon name={icon} size={24} color={palette.white} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  pressed: {
    transform: [{ scale: 0.95 }],
  },
});
