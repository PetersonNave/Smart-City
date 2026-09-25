import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { fonts, palette } from '../../theme';

export type SegmentOption<T extends string> = { value: T; label: string };

export type SegmentedControlProps<T extends string> = {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel?: string;
  testID?: string;
};

// Figma "segmented-control": trilho branco translúcido, opção ativa em branco sólido.
// Rola na horizontal quando as opções não cabem na largura da tela.
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
  testID = 'segmented',
}: SegmentedControlProps<T>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.track}
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
    >
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <Pressable
            key={option.value}
            testID={`${testID}-${option.value}`}
            onPress={() => onChange(option.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            style={[styles.segment, isActive && styles.segmentActive]}
          >
            <Text style={[styles.label, isActive && styles.labelActive]} numberOfLines={1}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  track: {
    flexGrow: 1,
    gap: 4,
    padding: 4,
    borderRadius: 12,
    backgroundColor: palette.headerButton,
  },
  segment: {
    flexGrow: 1,
    minWidth: 72,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  segmentActive: {
    backgroundColor: palette.white,
  },
  label: {
    fontFamily: fonts.inter.semiBold,
    fontSize: 13,
    color: palette.white,
  },
  labelActive: {
    fontFamily: fonts.inter.bold,
    color: palette.segmentActiveText,
  },
});
