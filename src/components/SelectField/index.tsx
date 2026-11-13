import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, palette } from '../../theme';
import { Icon } from '../Icon';

export type SelectOption<T extends string> = { value: T; label: string };

export type SelectFieldProps<T extends string> = {
  label: string;
  placeholder: string;
  value: T | '';
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  error?: string;
  /** `chip`: versão compacta para barras de filtro (sem rótulo acima; o rótulo vira o título da folha). */
  variant?: 'card' | 'chip';
  testID?: string;
};

// Figma "select-card": card branco com chevron; abre uma folha inferior com as opções.
export function SelectField<T extends string>({
  label,
  placeholder,
  value,
  options,
  onChange,
  error,
  variant = 'card',
  testID = 'select',
}: SelectFieldProps<T>) {
  const isChip = variant === 'chip';
  const [isOpen, setIsOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const selected = options.find((option) => option.value === value);

  return (
    <View style={isChip ? styles.chipContainer : styles.container}>
      {!isChip && <Text style={styles.label}>{label}</Text>}
      <Pressable
        testID={`${testID}-trigger`}
        onPress={() => setIsOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${selected?.label ?? placeholder}`}
        style={[isChip ? styles.chip : styles.field, error ? styles.fieldError : null]}
      >
        <Text
          style={isChip ? styles.chipValue : [styles.value, !selected && styles.placeholder]}
          numberOfLines={1}
        >
          {selected?.label ?? placeholder}
        </Text>
        <Icon name="chevronDown" size={isChip ? 16 : 20} color={isChip ? palette.white : palette.textStrong} />
      </Pressable>
      {error && (
        <Text testID={`${testID}-error`} style={styles.error}>
          {error}
        </Text>
      )}

      <Modal visible={isOpen} transparent animationType="slide" onRequestClose={() => setIsOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setIsOpen(false)} testID={`${testID}-backdrop`} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>{label}</Text>
          {/* Poucas opções (categorias, regiões, status): renderiza todas de uma vez. */}
          <ScrollView>
            {options.map((item) => {
              const isSelected = item.value === value;
              return (
                <Pressable
                  key={item.value}
                  testID={`${testID}-option-${item.value}`}
                  onPress={() => {
                    onChange(item.value);
                    setIsOpen(false);
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  style={styles.option}
                >
                  <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>{item.label}</Text>
                  {isSelected && <Icon name="check" size={20} color={colors.primary} />}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontFamily: fonts.inter.semiBold,
    fontSize: 16,
    color: palette.white,
    marginBottom: 8,
    marginLeft: 16,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    height: 55,
    paddingHorizontal: 16,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.secondary,
    backgroundColor: palette.white,
  },
  chipContainer: {
    flex: 1,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: palette.headerButton,
  },
  chipValue: {
    flex: 1,
    fontFamily: fonts.inter.semiBold,
    fontSize: 13,
    color: palette.white,
  },
  fieldError: {
    borderColor: palette.dangerBorder,
  },
  value: {
    flex: 1,
    fontFamily: fonts.inter.bold,
    fontSize: 16,
    color: palette.textStrong,
  },
  placeholder: {
    color: palette.textPlaceholder,
  },
  error: {
    fontFamily: fonts.inter.semiBold,
    fontSize: 13,
    color: palette.dangerStrong,
    marginTop: 4,
    marginLeft: 16,
  },
  backdrop: {
    flex: 1,
    backgroundColor: palette.overlay,
  },
  sheet: {
    backgroundColor: palette.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 12,
    paddingHorizontal: 24,
    maxHeight: '70%',
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 100,
    backgroundColor: palette.border,
    marginBottom: 16,
  },
  sheetTitle: {
    fontFamily: fonts.inter.extraBold,
    fontSize: 18,
    color: palette.text,
    marginBottom: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: palette.border,
  },
  optionLabel: {
    fontFamily: fonts.inter.medium,
    fontSize: 16,
    color: palette.text,
  },
  optionLabelSelected: {
    fontFamily: fonts.inter.bold,
    color: colors.primary,
  },
});
